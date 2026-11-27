import { z } from 'zod';
import type { ToolRegistrar } from '../context.js';
import { addDays, normalizeDate, splitIso, todayInTurkey } from '../lib/dates.js';
import { HttpError, type HttpClient } from '../lib/http.js';
import { errorResult, jsonResult, safely } from '../lib/result.js';

export const TCMB_TODAY_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

/** How many days to walk back when a date has no bulletin (weekends, Bayram holidays up to 9 days). */
export const MAX_FALLBACK_DAYS = 10;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export interface Kur {
  code: string;
  unit: number;
  nameTr: string;
  nameEn: string;
  forexBuying: number | null;
  forexSelling: number | null;
  banknoteBuying: number | null;
  banknoteSelling: number | null;
  crossRateUSD: number | null;
  crossRateOther: number | null;
}

export interface KurBulteni {
  /** Bulletin date, YYYY-MM-DD */
  date: string;
  bulletinNo: string | null;
  rates: Kur[];
}

/** https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml */
export function archiveUrl(iso: string): string {
  const { yyyy, mm, dd } = splitIso(iso);
  return `https://www.tcmb.gov.tr/kurlar/${yyyy}${mm}/${dd}${mm}${yyyy}.xml`;
}

function tag(block: string, name: string): string | null {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(block);
  if (!m) return null; // self-closing (<Tag/>) or missing
  const value = (m[1] ?? '').trim();
  return value === '' ? null : value;
}

function num(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Parses TCMB's kurlar XML (today.xml or a dated archive file). */
export function parseTcmbXml(xml: string): KurBulteni {
  const root = /<Tarih_Date\b([^>]*)>/.exec(xml);
  if (!root) throw new Error('Unexpected TCMB response: <Tarih_Date> element not found');
  const attrs = root[1] ?? '';
  const tarih = /\bTarih="(\d{2})\.(\d{2})\.(\d{4})"/.exec(attrs);
  if (!tarih) throw new Error('Unexpected TCMB response: bulletin date missing');
  const date = `${tarih[3]}-${tarih[2]}-${tarih[1]}`;
  const bulletinNo = /\bBulten_No="([^"]*)"/.exec(attrs)?.[1] ?? null;

  const rates: Kur[] = [];
  const currencyRe = /<Currency\b([^>]*)>([\s\S]*?)<\/Currency>/g;
  for (let m = currencyRe.exec(xml); m; m = currencyRe.exec(xml)) {
    const code = /\bCurrencyCode="([A-Z]{3})"/.exec(m[1] ?? '')?.[1] ?? /\bKod="([A-Z]{3})"/.exec(m[1] ?? '')?.[1];
    if (!code) continue;
    const body = m[2] ?? '';
    rates.push({
      code,
      unit: num(tag(body, 'Unit')) ?? 1,
      nameTr: decodeEntities(tag(body, 'Isim') ?? ''),
      nameEn: decodeEntities(tag(body, 'CurrencyName') ?? ''),
      forexBuying: num(tag(body, 'ForexBuying')),
      forexSelling: num(tag(body, 'ForexSelling')),
      banknoteBuying: num(tag(body, 'BanknoteBuying')),
      banknoteSelling: num(tag(body, 'BanknoteSelling')),
      crossRateUSD: num(tag(body, 'CrossRateUSD')),
      crossRateOther: num(tag(body, 'CrossRateOther')),
    });
  }
  if (rates.length === 0) throw new Error('Unexpected TCMB response: no <Currency> elements');
  return { date, bulletinNo, rates };
}

export interface BulletinLookup {
  bulletin: KurBulteni;
  requestedDate: string | null;
  /** True when the requested date had no bulletin and an earlier one is returned. */
  fellBack: boolean;
  sourceUrl: string;
}

/**
 * Returns the bulletin for `requested` (YYYY-MM-DD), or the latest bulletin published before it
 * (weekends, public holidays, or before ~15:30 on the day itself). Without a date: today.xml.
 */
export async function fetchBulletin(http: HttpClient, requested: string | null, today: string): Promise<BulletinLookup> {
  if (requested === null) {
    const xml = await http.getText(TCMB_TODAY_URL, { ttlMs: 10 * MINUTE });
    return { bulletin: parseTcmbXml(xml), requestedDate: null, fellBack: false, sourceUrl: TCMB_TODAY_URL };
  }

  for (let back = 0; back <= MAX_FALLBACK_DAYS; back++) {
    const date = addDays(requested, -back);
    const url = archiveUrl(date);
    try {
      // Past bulletins never change; a missing file for today may still appear after 15:30.
      const xml = await http.getText(url, {
        ttlMs: 24 * HOUR,
        notFoundTtlMs: date >= today ? 10 * MINUTE : 6 * HOUR,
      });
      return { bulletin: parseTcmbXml(xml), requestedDate: requested, fellBack: back > 0, sourceUrl: url };
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) continue;
      throw error;
    }
  }
  throw new Error(`No TCMB bulletin found between ${addDays(requested, -MAX_FALLBACK_DAYS)} and ${requested}`);
}

const NOTES = [
  'TCMB gösterge niteliğindeki kurlar bülten tarihinde saat 15:30 civarında ilan edilir; bankaların uyguladığı kurlar farklıdır. / Indicative rates announced by TCMB around 15:30 (Istanbul) on the bulletin date; bank rates differ.',
  'Değerler "unit" birim yabancı para karşılığı TL’dir (ör. JPY için 100 birim). / Values are TRY per "unit" units of the currency (e.g. 100 JPY).',
  'Gayriresmî araç; TCMB ile bağlantısı yoktur. Yatırım tavsiyesi değildir. / Unofficial; not affiliated with TCMB. Not financial advice.',
];

export const registerExchangeRateTool: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'doviz_kurlari',
    {
      title: 'TCMB exchange rates',
      description:
        'TCMB (Türkiye Cumhuriyet Merkez Bankası) gösterge niteliğindeki döviz kurlarını getirir: döviz alış/satış, efektif alış/satış, çapraz kurlar. ' +
        'Tarih verilmezse son yayımlanan bülten; hafta sonu/tatil gibi bülten olmayan günlerde bir önceki yayımlanmış bültene düşer. ' +
        'Indicative exchange rates from the Central Bank of the Republic of Türkiye (TCMB). Without a date: latest bulletin. For dates without a bulletin (weekends, holidays) it falls back to the last published day.',
      inputSchema: {
        tarih: z
          .string()
          .optional()
          .describe('Bülten tarihi (YYYY-MM-DD veya GG.AA.YYYY); boşsa en güncel / Bulletin date; empty = latest'),
        kodlar: z
          .array(z.string().min(3).max(3))
          .max(30)
          .optional()
          .describe('Döviz kodları, ör. ["USD","EUR"]; boşsa tümü / ISO currency codes, e.g. ["USD","EUR"]; empty = all'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ tarih, kodlar }) =>
      safely(async () => {
        const today = todayInTurkey(ctx.now());
        let requested: string | null = null;
        if (tarih !== undefined && tarih.trim() !== '') {
          requested = normalizeDate(tarih);
          if (!requested) return errorResult(`Geçersiz tarih: "${tarih}". Örnek: 2026-11-27 / Invalid date`);
          if (requested > today) return errorResult(`Gelecek tarih için kur yok (${requested}) / No rates for a future date`);
        }

        // today.xml always holds the latest published bulletin, so use it for "today" as well.
        const lookup = await fetchBulletin(ctx.http, requested === today ? null : requested, today);
        const fellBack = requested !== null && lookup.bulletin.date !== requested;
        const wanted = (kodlar ?? []).map((c) => c.toUpperCase());
        const rates = wanted.length > 0 ? lookup.bulletin.rates.filter((r) => wanted.includes(r.code)) : lookup.bulletin.rates;
        const missing = wanted.filter((c) => !lookup.bulletin.rates.some((r) => r.code === c));

        const notes = [...NOTES];
        if (fellBack) {
          notes.unshift(
            `${requested} için bülten yok (hafta sonu, resmî tatil veya henüz yayımlanmadı); en son yayımlanan ${lookup.bulletin.date} bülteni gösteriliyor. / ` +
              `No bulletin for ${requested} (weekend, holiday or not published yet); showing the last published bulletin (${lookup.bulletin.date}).`,
          );
        }
        return jsonResult({
          bulletinDate: lookup.bulletin.date,
          bulletinNo: lookup.bulletin.bulletinNo,
          requestedDate: requested ?? 'latest',
          fellBack,
          currency: 'TRY',
          rates,
          ...(missing.length > 0 ? { notFound: missing, available: lookup.bulletin.rates.map((r) => r.code) } : {}),
          source: lookup.sourceUrl,
          notes,
        });
      }),
  );
};
