import { z } from 'zod';
import type { ToolRegistrar } from '../context.js';
import { normalizeDate, splitIso } from '../lib/dates.js';
import { HttpError, type HttpClient } from '../lib/http.js';
import { errorResult, jsonResult, safely } from '../lib/result.js';
import { foldTr, matchesAllTokens, tokenize } from '../lib/text.js';

/**
 * Reads the open Resmî Gazete dataset published by the resmi-gazete-takip project
 * (https://github.com/demiralpozturk/resmi-gazete-takip, MIT). It never scrapes resmigazete.gov.tr.
 */
export const RG_BASE = 'https://demiralpozturk.github.io/resmi-gazete-takip/';
export const RG_DATA = `${RG_BASE}data/`;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export interface RgMadde {
  id: string;
  tarih: string;
  sayi: number;
  mukerrer: number;
  bolum: string;
  tur: string;
  tur_kisa: string;
  baslik: string;
  kurum: string | null;
  url: string;
  bicim?: string;
  sira: number;
  kategoriler: string[];
}

export interface RgSayi {
  sayi: number;
  mukerrer: number;
  baslik?: string;
  pdf?: string;
  fihrist?: string;
  madde_sayisi?: number;
}

export interface RgGun {
  tarih: string;
  sayilar: RgSayi[];
  madde_sayisi: number;
  maddeler: RgMadde[];
}

export interface RgIndex {
  son_tarih: string;
  ilk_tarih: string;
  gun_sayisi: number;
  gunler: Array<{ tarih: string; madde_sayisi: number; dosya: string }>;
}

export interface RgSon90 {
  baslangic: string;
  bitis: string;
  madde_sayisi: number;
  maddeler: RgMadde[];
}

export interface RgKategori {
  kod: string;
  ad: string;
  aciklama?: string;
}

export function dayUrl(iso: string): string {
  const { yyyy, mm, dd } = splitIso(iso);
  return `${RG_DATA}${yyyy}/${mm}/${dd}.json`;
}

export function compactItem(m: RgMadde, withDate = false) {
  return {
    ...(withDate ? { date: m.tarih } : {}),
    type: m.tur_kisa || m.tur,
    title: m.baslik,
    institution: m.kurum ?? null,
    section: m.bolum,
    categories: m.kategoriler,
    issue: m.mukerrer > 0 ? `${m.sayi} (${m.mukerrer}. mükerrer)` : String(m.sayi),
    url: m.url,
  };
}

/** Resolves a user-supplied category (code or display name, accent-insensitive) to its code. */
export function resolveCategory(input: string, categories: readonly RgKategori[]): RgKategori | undefined {
  const q = foldTr(input);
  return categories.find((k) => foldTr(k.kod) === q || foldTr(k.ad) === q) ?? categories.find((k) => foldTr(k.ad).includes(q));
}

export interface SearchOptions {
  query?: string;
  category?: string;
  from?: string;
  to?: string;
}

export function searchItems(items: readonly RgMadde[], opts: SearchOptions): RgMadde[] {
  const tokens = tokenize(opts.query ?? '');
  return items
    .filter((m) => (opts.category ? m.kategoriler.includes(opts.category) : true))
    .filter((m) => (opts.from ? m.tarih >= opts.from : true))
    .filter((m) => (opts.to ? m.tarih <= opts.to : true))
    .filter((m) => matchesAllTokens(`${m.baslik} ${m.kurum ?? ''} ${m.tur} ${m.tur_kisa}`, tokens))
    .sort((a, b) => b.tarih.localeCompare(a.tarih) || a.sira - b.sira);
}

const getCategories = (http: HttpClient) => http.getJson<RgKategori[]>(`${RG_DATA}kategoriler.json`, { ttlMs: 6 * HOUR });

const NOTES = [
  'Veri, resmi-gazete-takip açık veri projesinden okunur (Resmî Gazete fihristinden günlük derlenir); asıl metin için "url" bağlantısındaki resmî yayına bakın. / ' +
    'Data comes from the open resmi-gazete-takip dataset (compiled daily from the official index); always check the official text at "url".',
  'Kategoriler anahtar kelimeyle otomatik atanır ve eksik/hatalı olabilir. / Categories are keyword-based and may be incomplete.',
  'Gayriresmî araç; Resmî Gazete ile bağlantısı yoktur. / Unofficial; not affiliated with the Resmî Gazete.',
];

function categoryHint(categories: readonly RgKategori[]): string {
  return categories.map((k) => `${k.kod} (${k.ad})`).join(', ');
}

export const registerResmiGazeteTools: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'resmi_gazete_gunluk',
    {
      title: 'Resmî Gazete: daily contents',
      description:
        'Belirli bir günün (varsayılan: en son) Resmî Gazete içeriğini listeler: yönetmelik, tebliğ, karar, ilan vb. başlıkları, kurum, kategori ve resmî bağlantılarla. ' +
        'İsteğe bağlı kategori filtresi (ör. gumruk, dis-ticaret, vergi, finans, enerji). ' +
        'Lists the contents of the Turkish Official Gazette for a day (default: latest) with titles, institutions, categories and official links. Optional category filter.',
      inputSchema: {
        tarih: z.string().optional().describe('Tarih (YYYY-MM-DD veya GG.AA.YYYY); boşsa en son sayı / Date; empty = latest issue'),
        kategori: z
          .string()
          .max(40)
          .optional()
          .describe('Kategori kodu veya adı, ör. "gumruk", "dis-ticaret", "vergi" / Category code or name'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ tarih, kategori }) =>
      safely(async () => {
        let day: RgGun;
        let url: string;
        if (tarih === undefined || tarih.trim() === '') {
          url = `${RG_DATA}latest.json`;
          day = await ctx.http.getJson<RgGun>(url, { ttlMs: 30 * MINUTE });
        } else {
          const iso = normalizeDate(tarih);
          if (!iso) return errorResult(`Geçersiz tarih: "${tarih}". Örnek: 2026-11-27 / Invalid date`);
          url = dayUrl(iso);
          try {
            day = await ctx.http.getJson<RgGun>(url, { ttlMs: 6 * HOUR, notFoundTtlMs: 30 * MINUTE });
          } catch (error) {
            if (!(error instanceof HttpError && error.status === 404)) throw error;
            const index = await ctx.http.getJson<RgIndex>(`${RG_DATA}index.json`, { ttlMs: 30 * MINUTE });
            const earlier = index.gunler.map((g) => g.tarih).filter((d) => d < iso).sort().pop();
            return errorResult(
              `${iso} için veri yok. Veri seti ${index.ilk_tarih} – ${index.son_tarih} aralığını kapsıyor` +
                (earlier ? `; en yakın önceki gün: ${earlier}.` : '.') +
                ` / No data for ${iso}. Dataset covers ${index.ilk_tarih} – ${index.son_tarih}.`,
            );
          }
        }

        let items = day.maddeler;
        let category: RgKategori | undefined;
        if (kategori !== undefined && kategori.trim() !== '') {
          const categories = await getCategories(ctx.http);
          category = resolveCategory(kategori, categories);
          if (!category) return errorResult(`Bilinmeyen kategori "${kategori}". Seçenekler: ${categoryHint(categories)}`);
          items = items.filter((m) => m.kategoriler.includes(category!.kod));
        }

        return jsonResult({
          date: day.tarih,
          issues: day.sayilar.map((s) => ({
            number: s.sayi,
            repeat: s.mukerrer,
            title: s.baslik ?? null,
            pdf: s.pdf ?? null,
            index: s.fihrist ?? null,
          })),
          totalItems: day.madde_sayisi,
          ...(category ? { category: { code: category.kod, name: category.ad }, matchingItems: items.length } : {}),
          items: [...items].sort((a, b) => a.sira - b.sira).map((m) => compactItem(m)),
          source: url,
          notes: NOTES,
        });
      }),
  );

  server.registerTool(
    'resmi_gazete_ara',
    {
      title: 'Resmî Gazete: search the last 90 days',
      description:
        'Son 90 günün Resmî Gazete başlıklarında arama yapar (başlık, kurum, tür). Türkçe karakter ve büyük/küçük harf duyarsızdır; tüm kelimeler eşleşmelidir. Kategori ve tarih aralığıyla daraltılabilir. ' +
        'Searches Official Gazette titles of the last 90 days (title, institution, type). Accent/case-insensitive, all words must match; filter by category and date range.',
      inputSchema: {
        sorgu: z
          .string()
          .max(200)
          .optional()
          .describe('Aranacak kelimeler, ör. "gümrük yönetmelik" / Search words; optional when a category is given'),
        kategori: z.string().max(40).optional().describe('Kategori kodu veya adı, ör. "gumruk" / Category code or name'),
        baslangic: z.string().optional().describe('Başlangıç tarihi (dahil) / From date (inclusive)'),
        bitis: z.string().optional().describe('Bitiş tarihi (dahil) / To date (inclusive)'),
        limit: z.number().int().min(1).max(100).default(20).describe('En fazla sonuç (1-100, varsayılan 20) / Max results'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ sorgu, kategori, baslangic, bitis, limit }) =>
      safely(async () => {
        const hasQuery = sorgu !== undefined && sorgu.trim() !== '';
        const hasCategory = kategori !== undefined && kategori.trim() !== '';
        if (!hasQuery && !hasCategory) {
          return errorResult('Bir arama sorgusu veya kategori verin. / Provide a search query or a category.');
        }
        const from = baslangic ? normalizeDate(baslangic) : undefined;
        const to = bitis ? normalizeDate(bitis) : undefined;
        if (from === null || to === null) return errorResult('Geçersiz tarih. Örnek: 2026-11-01 / Invalid date');

        let category: RgKategori | undefined;
        if (hasCategory) {
          const categories = await getCategories(ctx.http);
          category = resolveCategory(kategori!, categories);
          if (!category) return errorResult(`Bilinmeyen kategori "${kategori}". Seçenekler: ${categoryHint(categories)}`);
        }

        const url = `${RG_DATA}son90.json`;
        const data = await ctx.http.getJson<RgSon90>(url, { ttlMs: HOUR });
        const results = searchItems(data.maddeler, {
          query: hasQuery ? sorgu : undefined,
          category: category?.kod,
          from: from ?? undefined,
          to: to ?? undefined,
        });
        const shown = results.slice(0, limit);
        // The window is nominally 90 days, but the dataset may have started later than that.
        const earliest = data.maddeler.reduce((min, m) => (m.tarih < min ? m.tarih : min), data.bitis);

        return jsonResult({
          query: hasQuery ? sorgu : null,
          ...(category ? { category: { code: category.kod, name: category.ad } } : {}),
          coverage: { from: earliest > data.baslangic ? earliest : data.baslangic, to: data.bitis },
          totalMatches: results.length,
          returned: shown.length,
          results: shown.map((m) => compactItem(m, true)),
          ...(results.length === 0
            ? { hint: 'Daha kısa veya farklı kelimeler deneyin; arama yalnızca başlık/kurum/türde yapılır. / Try fewer or different words; only titles are searched.' }
            : {}),
          source: url,
          notes: NOTES,
        });
      }),
  );
};
