import { describe, expect, it } from 'vitest';
import { DINI_BAYRAMLAR } from '../src/data/dini-bayramlar.js';
import { dayNameTr } from '../src/lib/dates.js';
import { dayStatus, holidaysOf, nextHoliday } from '../src/tools/tatiller.js';

describe('religious holiday table', () => {
  it('covers 2024-2030 and matches the weekdays printed by Diyanet', () => {
    expect(Object.keys(DINI_BAYRAMLAR).map(Number)).toEqual([2024, 2025, 2026, 2027, 2028, 2029, 2030]);
    for (const [year, d] of Object.entries(DINI_BAYRAMLAR)) {
      expect(d.ramazan.ilkGun.startsWith(year)).toBe(true);
      expect(d.kurban.ilkGun.startsWith(year)).toBe(true);
      expect(dayNameTr(d.ramazan.ilkGun)).toBe(d.ramazan.gunAdi);
      expect(dayNameTr(d.kurban.ilkGun)).toBe(d.kurban.gunAdi);
      // Kurban Bayramı is ~70 days after Ramazan Bayramı (10 Zilhicce vs 1 Şevval).
      const gap = (Date.parse(d.kurban.ilkGun) - Date.parse(d.ramazan.ilkGun)) / 86_400_000;
      expect(gap).toBeGreaterThanOrEqual(67);
      expect(gap).toBeLessThanOrEqual(71);
    }
  });
});

describe('holidaysOf', () => {
  it('lists 2026 holidays with half-day eves', () => {
    const list = holidaysOf(2026);
    const dates = list.map((t) => t.date);
    expect(dates).toContain('2026-01-01');
    expect(dates).toContain('2026-07-15');
    expect(dates).toContain('2026-10-29');
    // Ramazan Bayramı 20-22 March 2026, arife 19 March.
    expect(list.find((t) => t.date === '2026-03-19')).toMatchObject({ halfDay: true, type: 'dini' });
    expect(dates).toEqual(expect.arrayContaining(['2026-03-20', '2026-03-21', '2026-03-22']));
    // Kurban Bayramı 27-30 May 2026, arife 26 May.
    expect(list.find((t) => t.date === '2026-05-26')?.halfDay).toBe(true);
    expect(dates).toEqual(expect.arrayContaining(['2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30']));
    expect(list.find((t) => t.date === '2026-10-28')?.halfDay).toBe(true);
    // 8 fixed (one half) + 3 + 4 religious days + 2 religious eves
    expect(list).toHaveLength(17);
    expect(list.filter((t) => !t.halfDay)).toHaveLength(14);
    expect([...dates].sort()).toEqual(dates);
  });

  it('returns only fixed holidays outside the religious table', () => {
    const list = holidaysOf(2031);
    expect(list).toHaveLength(8);
    expect(list.every((t) => t.type === 'ulusal')).toBe(true);
  });

  it('merges a religious day that falls on a fixed holiday', () => {
    // 2029: Kurban arife 23 April (half day) coincides with 23 Nisan (full day).
    const list = holidaysOf(2029);
    const day = list.filter((t) => t.date === '2029-04-23');
    expect(day).toHaveLength(1);
    expect(day[0]?.halfDay).toBe(false);
    expect(day[0]?.name).toMatch(/Ulusal Egemenlik.*Kurban Bayramı Arifesi/);
  });
});

describe('dayStatus / nextHoliday', () => {
  it('classifies days', () => {
    expect(dayStatus('2026-05-27').status).toBe('resmi_tatil');
    expect(dayStatus('2026-05-26').status).toBe('yarim_gun_tatil');
    expect(dayStatus('2026-11-28').status).toBe('hafta_sonu');
    expect(dayStatus('2026-11-27').status).toBe('is_gunu');
    expect(dayStatus('2035-11-27').status).toBe('bilinmiyor');
  });

  it('finds the next holiday, crossing the year boundary', () => {
    expect(nextHoliday('2026-11-27')?.date).toBe('2027-01-01');
    expect(nextHoliday('2026-05-01')?.date).toBe('2026-05-19');
  });
});
