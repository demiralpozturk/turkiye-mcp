import { z } from 'zod';
import type { ToolRegistrar } from '../context.js';
import { ILLER, type Il } from '../data/il-ilce.js';
import { errorResult, jsonResult } from '../lib/result.js';
import { foldTr } from '../lib/text.js';

/** Common informal names → official province names. */
const ALIASES: Readonly<Record<string, string>> = {
  afyon: 'Afyonkarahisar',
  maras: 'Kahramanmaraş',
  'k.maras': 'Kahramanmaraş',
  'k. maras': 'Kahramanmaraş',
  urfa: 'Şanlıurfa',
  antep: 'Gaziantep',
  icel: 'Mersin',
  dersim: 'Tunceli',
};

export const BOLGELER = ['Akdeniz', 'Ege', 'Marmara', 'İç Anadolu', 'Karadeniz', 'Doğu Anadolu', 'Güneydoğu Anadolu'] as const;

export function plateCode(plaka: number): string {
  return String(plaka).padStart(2, '0');
}

export function findProvince(query: string | number): Il | undefined {
  if (typeof query === 'number') return ILLER.find((p) => p.plaka === query);
  const q = query.trim();
  if (/^\d{1,2}$/.test(q)) return ILLER.find((p) => p.plaka === Number(q));
  const folded = foldTr(q);
  const official = ALIASES[folded];
  const target = official ? foldTr(official) : folded;
  return ILLER.find((p) => foldTr(p.il) === target);
}

export interface IlceEslesme {
  ilce: string;
  il: string;
  plaka: string;
}

/** Districts whose name equals the query (accent/case-insensitive); falls back to "starts with". */
export function findDistricts(query: string): { exact: boolean; matches: IlceEslesme[] } {
  const q = foldTr(query);
  const all: IlceEslesme[] = ILLER.flatMap((p) => p.ilceler.map((ilce) => ({ ilce, il: p.il, plaka: plateCode(p.plaka) })));
  const exact = all.filter((d) => foldTr(d.ilce) === q);
  if (exact.length > 0) return { exact: true, matches: exact };
  return { exact: false, matches: all.filter((d) => foldTr(d.ilce).startsWith(q)) };
}

export function provinceDetail(p: Il) {
  return {
    plaka: plateCode(p.plaka),
    il: p.il,
    bolge: p.bolge,
    buyuksehir: p.buyuksehir,
    ilceSayisi: p.ilceler.length,
    ilceler: p.ilceler,
  };
}

function provinceSummary(p: Il) {
  return { plaka: plateCode(p.plaka), il: p.il, bolge: p.bolge, buyuksehir: p.buyuksehir, ilceSayisi: p.ilceler.length };
}

const SOURCE =
  'İl/ilçe adları ve plaka kodları kamuya açık resmî idari bölüm bilgileridir (81 il, 973 ilçe; İçişleri Bakanlığı Mülki İdare Bölümleri). Kaynak notları: NOTICE dosyası. / ' +
  'Official administrative divisions (81 provinces, 973 districts). Provenance: see NOTICE.';

const MERKEZ_NOTE =
  'Büyükşehir olmayan 51 ilde il merkezinin bulunduğu ilçe "Merkez" olarak adlandırılır. / In the 51 non-metropolitan provinces the central district is named "Merkez".';

export const registerIlIlceTool: ToolRegistrar = (server) => {
  server.registerTool(
    'il_ilce',
    {
      title: 'Provinces and districts of Türkiye',
      description:
        'Türkiye’nin 81 ilini plaka kodu, coğrafi bölge ve büyükşehir bilgisiyle; seçilen ilin ilçelerini listeler. İl adı ("Urfa", "Afyon" gibi yaygın adlar dahil), plaka kodu veya ilçe adıyla arar. ' +
        'Lists the 81 provinces with plate codes, regions and districts. Search by province name, plate code or district name (e.g. "Kadıköy" → İstanbul). No arguments: all provinces.',
      inputSchema: {
        sorgu: z
          .string()
          .max(64)
          .optional()
          .describe('İl adı, plaka kodu ("34") veya ilçe adı / Province name, plate code or district name'),
        plaka: z.number().int().min(1).max(81).optional().describe('Plaka kodu 1-81 / Plate code 1-81'),
        bolge: z
          .string()
          .max(32)
          .optional()
          .describe(`Bölge filtresi: ${BOLGELER.join(', ')} / Region filter for the province list`),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ sorgu, plaka, bolge }) => {
      if (plaka !== undefined) {
        const p = findProvince(plaka);
        return p ? jsonResult({ ...provinceDetail(p), notes: [MERKEZ_NOTE], source: SOURCE }) : errorResult(`Plaka bulunamadı: ${plaka}`);
      }

      if (sorgu !== undefined && sorgu.trim() !== '') {
        const p = findProvince(sorgu);
        if (p) return jsonResult({ ...provinceDetail(p), notes: [MERKEZ_NOTE], source: SOURCE });

        const { exact, matches } = findDistricts(sorgu);
        if (matches.length > 0) {
          const limited = matches.slice(0, 60);
          return jsonResult({
            query: sorgu,
            match: exact ? 'ilce_tam_eslesme' : 'ilce_baslangic_eslesme',
            count: matches.length,
            districts: limited,
            truncated: matches.length > limited.length,
            notes: foldTr(sorgu) === 'merkez' ? [MERKEZ_NOTE] : [],
            source: SOURCE,
          });
        }
        return errorResult(
          `"${sorgu}" için il veya ilçe bulunamadı. Plaka kodu (1-81), il adı ya da ilçe adı deneyin. / No province or district found.`,
        );
      }

      let list = ILLER;
      if (bolge !== undefined && bolge.trim() !== '') {
        const b = foldTr(bolge).replace(/ bolgesi$/, '');
        list = ILLER.filter((p) => foldTr(p.bolge) === b);
        if (list.length === 0) return errorResult(`Bilinmeyen bölge: "${bolge}". Seçenekler: ${BOLGELER.join(', ')}`);
      }
      return jsonResult({
        count: list.length,
        districtTotal: list.reduce((n, p) => n + p.ilceler.length, 0),
        provinces: list.map(provinceSummary),
        hint: 'İlçeler için il adı veya plaka ile tekrar sorun. / Ask again with a province name or plate code to get its districts.',
        source: SOURCE,
      });
    },
  );
};
