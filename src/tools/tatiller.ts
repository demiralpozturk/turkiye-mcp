import { z } from 'zod';
import type { ToolRegistrar } from '../context.js';
import { DINI_BAYRAMLAR, DINI_BAYRAM_YIL_ARALIGI } from '../data/dini-bayramlar.js';
import { addDays, dayNameEn, dayNameTr, isWeekend, normalizeDate, todayInTurkey } from '../lib/dates.js';
import { errorResult, jsonResult } from '../lib/result.js';

export interface Tatil {
  date: string;
  day: string;
  dayEn: string;
  name: string;
  nameEn: string;
  type: 'ulusal' | 'dini';
  /** Half-day holidays start at 13:00 (arife days and 28 October). */
  halfDay: boolean;
}

export const MIN_YEAR = 2017; // 15 Temmuz has been a public holiday since 2017.
export const MAX_YEAR = 2100;

/**
 * Fixed national holidays, Law No. 2429 "Ulusal Bayram ve Genel Tatiller Hakkında Kanun"
 * (1 May since 2009, 15 July since 2017).
 */
const FIXED: ReadonlyArray<{ md: string; name: string; nameEn: string; halfDay?: boolean }> = [
  { md: '01-01', name: 'Yılbaşı', nameEn: "New Year's Day" },
  { md: '04-23', name: 'Ulusal Egemenlik ve Çocuk Bayramı', nameEn: 'National Sovereignty and Children’s Day' },
  { md: '05-01', name: 'Emek ve Dayanışma Günü', nameEn: 'Labour and Solidarity Day' },
  { md: '05-19', name: 'Atatürk’ü Anma, Gençlik ve Spor Bayramı', nameEn: 'Commemoration of Atatürk, Youth and Sports Day' },
  { md: '07-15', name: 'Demokrasi ve Millî Birlik Günü', nameEn: 'Democracy and National Unity Day' },
  { md: '08-30', name: 'Zafer Bayramı', nameEn: 'Victory Day' },
  { md: '10-28', name: 'Cumhuriyet Bayramı Arifesi (13:00’ten itibaren)', nameEn: 'Republic Day Eve (from 13:00)', halfDay: true },
  { md: '10-29', name: 'Cumhuriyet Bayramı', nameEn: 'Republic Day' },
];

function make(date: string, name: string, nameEn: string, type: Tatil['type'], halfDay = false): Tatil {
  return { date, day: dayNameTr(date), dayEn: dayNameEn(date), name, nameEn, type, halfDay };
}

export function hasReligiousData(year: number): boolean {
  return year >= DINI_BAYRAM_YIL_ARALIGI.min && year <= DINI_BAYRAM_YIL_ARALIGI.max;
}

/** All public holidays of a year, sorted by date. Religious holidays only for years in the static table. */
export function holidaysOf(year: number): Tatil[] {
  const list: Tatil[] = FIXED.map((f) => make(`${year}-${f.md}`, f.name, f.nameEn, 'ulusal', f.halfDay ?? false));

  const dini = DINI_BAYRAMLAR[year];
  if (dini) {
    const r = dini.ramazan.ilkGun;
    list.push(make(addDays(r, -1), 'Ramazan Bayramı Arifesi (13:00’ten itibaren)', 'Eid al-Fitr Eve (from 13:00)', 'dini', true));
    for (let i = 0; i < 3; i++) {
      list.push(make(addDays(r, i), `Ramazan Bayramı ${i + 1}. Gün`, `Eid al-Fitr, day ${i + 1}`, 'dini'));
    }
    const k = dini.kurban.ilkGun;
    list.push(make(addDays(k, -1), 'Kurban Bayramı Arifesi (13:00’ten itibaren)', 'Eid al-Adha Eve (from 13:00)', 'dini', true));
    for (let i = 0; i < 4; i++) {
      list.push(make(addDays(k, i), `Kurban Bayramı ${i + 1}. Gün`, `Eid al-Adha, day ${i + 1}`, 'dini'));
    }
  }

  // A religious holiday can coincide with a fixed one (e.g. 23 April); keep both names on one day.
  const byDate = new Map<string, Tatil>();
  for (const t of list.sort((a, b) => a.date.localeCompare(b.date))) {
    const existing = byDate.get(t.date);
    if (!existing) {
      byDate.set(t.date, t);
    } else {
      byDate.set(t.date, {
        ...existing,
        name: `${existing.name} + ${t.name}`,
        nameEn: `${existing.nameEn} + ${t.nameEn}`,
        halfDay: existing.halfDay && t.halfDay,
      });
    }
  }
  return [...byDate.values()];
}

export interface GunDurumu {
  date: string;
  day: string;
  weekend: boolean;
  holiday: Tatil | null;
  status: 'resmi_tatil' | 'yarim_gun_tatil' | 'hafta_sonu' | 'is_gunu' | 'bilinmiyor';
}

export function dayStatus(date: string): GunDurumu {
  const year = Number(date.slice(0, 4));
  const holiday = holidaysOf(year).find((t) => t.date === date) ?? null;
  const weekend = isWeekend(date);
  let status: GunDurumu['status'];
  if (holiday) status = holiday.halfDay ? 'yarim_gun_tatil' : 'resmi_tatil';
  else if (weekend) status = 'hafta_sonu';
  else status = hasReligiousData(year) ? 'is_gunu' : 'bilinmiyor';
  return { date, day: dayNameTr(date), weekend, holiday, status };
}

/** Next holiday strictly after `from` (searches up to the end of the static table range). */
export function nextHoliday(from: string): Tatil | null {
  const startYear = Number(from.slice(0, 4));
  for (let y = startYear; y <= Math.max(startYear + 1, DINI_BAYRAM_YIL_ARALIGI.max); y++) {
    const found = holidaysOf(y).find((t) => t.date > from);
    if (found) return found;
  }
  return null;
}

const NOTES = [
  'Sabit tatiller 2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun’a göre hesaplanır. / Fixed holidays follow Law No. 2429.',
  'Dini bayram tarihleri Diyanet İşleri Başkanlığı takviminden alınmıştır (2024–2030). / Religious holiday dates come from the Diyanet calendar (2024–2030).',
  'Arife günleri ve 28 Ekim 13:00’ten itibaren yarım gün tatildir. / Eves and 28 October are half days from 13:00.',
  'Hükümetin ilan edebileceği idari izin (köprü) günleri resmi tatil değildir ve listede yoktur. / Administrative bridge days are not public holidays and are not listed.',
];

export const registerHolidayTool: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'resmi_tatiller',
    {
      title: 'Turkish public holidays',
      description:
        'Türkiye’nin resmi tatillerini listeler: sabit ulusal bayramlar (her yıl için hesaplanır) ve Ramazan/Kurban bayramları (2024–2030, Diyanet takvimi), arifeler yarım gün. ' +
        'İsteğe bağlı "tarih" verilirse o günün tatil/iş günü durumunu söyler. ' +
        'Lists Turkish public holidays for a year: fixed national holidays plus Eid holidays (2024–2030) with half-day eves. Optionally checks a single date.',
      inputSchema: {
        yil: z
          .number()
          .int()
          .min(MIN_YEAR)
          .max(MAX_YEAR)
          .optional()
          .describe(`Yıl (${MIN_YEAR}-${MAX_YEAR}); varsayılan: bu yıl / Year; default: current year`),
        tarih: z
          .string()
          .optional()
          .describe('Kontrol edilecek gün (YYYY-MM-DD veya GG.AA.YYYY) / A date to check (YYYY-MM-DD or DD.MM.YYYY)'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ yil, tarih }) => {
      const today = todayInTurkey(ctx.now());
      let checked: GunDurumu | undefined;
      if (tarih !== undefined) {
        const date = normalizeDate(tarih);
        if (!date) return errorResult(`Geçersiz tarih: "${tarih}". Örnek: 2026-05-27 / Invalid date. Example: 2026-05-27`);
        const y = Number(date.slice(0, 4));
        if (y < MIN_YEAR || y > MAX_YEAR) return errorResult(`Tarih ${MIN_YEAR}-${MAX_YEAR} aralığında olmalı / Date must be within ${MIN_YEAR}-${MAX_YEAR}`);
        checked = dayStatus(date);
      }

      const year = yil ?? (checked ? Number(checked.date.slice(0, 4)) : Number(today.slice(0, 4)));
      const holidays = holidaysOf(year);
      const warnings: string[] = [];
      if (!hasReligiousData(year)) {
        warnings.push(
          `${year} için dini bayram tarihleri tabloda yok (yalnızca ${DINI_BAYRAM_YIL_ARALIGI.min}–${DINI_BAYRAM_YIL_ARALIGI.max}); yalnızca sabit tatiller listelendi. / ` +
            `Religious holiday dates for ${year} are not in the table; only fixed holidays are listed.`,
        );
      }
      const fullDays = holidays.filter((t) => !t.halfDay);
      return jsonResult({
        year,
        ...(checked ? { checkedDate: checked } : {}),
        summary: {
          fullDays: fullDays.length,
          halfDays: holidays.length - fullDays.length,
          fullDaysOnWeekdays: fullDays.filter((t) => !isWeekend(t.date)).length,
        },
        nextHoliday: year === Number(today.slice(0, 4)) ? nextHoliday(today) : undefined,
        holidays,
        warnings,
        notes: NOTES,
      });
    },
  );
};

