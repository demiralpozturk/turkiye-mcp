/** Date helpers working on plain calendar dates ("YYYY-MM-DD") in Türkiye's time zone. */

export const TZ = 'Europe/Istanbul';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TR_RE = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/;

export const DAY_NAMES_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;
export const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Today's date in Türkiye (Europe/Istanbul), as YYYY-MM-DD. */
export function todayInTurkey(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function isoDate(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/**
 * Accepts "YYYY-MM-DD", "DD.MM.YYYY" or "DD/MM/YYYY" and returns a validated YYYY-MM-DD,
 * or null when the input is not a real calendar date.
 */
export function normalizeDate(input: string): string | null {
  const s = input.trim();
  let y: number;
  let m: number;
  let d: number;
  const iso = ISO_RE.exec(s);
  const tr = TR_RE.exec(s);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else if (tr) {
    d = Number(tr[1]);
    m = Number(tr[2]);
    y = Number(tr[3]);
  } else {
    return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return isoDate(y, m, d);
}

function toUtc(iso: string): Date {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function addDays(iso: string, days: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** 0 = Sunday … 6 = Saturday */
export function dayOfWeek(iso: string): number {
  return toUtc(iso).getUTCDay();
}

export function dayNameTr(iso: string): string {
  return DAY_NAMES_TR[dayOfWeek(iso)] ?? '';
}

export function dayNameEn(iso: string): string {
  return DAY_NAMES_EN[dayOfWeek(iso)] ?? '';
}

export function isWeekend(iso: string): boolean {
  const d = dayOfWeek(iso);
  return d === 0 || d === 6;
}

/** "2026-11-27" -> { yyyy: "2026", mm: "11", dd: "27" } */
export function splitIso(iso: string): { yyyy: string; mm: string; dd: string } {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  return { yyyy: m[1]!, mm: m[2]!, dd: m[3]! };
}
