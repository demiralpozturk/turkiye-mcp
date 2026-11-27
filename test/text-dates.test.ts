import { describe, expect, it } from 'vitest';
import { addDays, dayNameTr, normalizeDate, todayInTurkey } from '../src/lib/dates.js';
import { foldTr, matchesAllTokens, tokenize } from '../src/lib/text.js';

describe('foldTr', () => {
  it('folds Turkish letters and case', () => {
    expect(foldTr('İSTANBUL')).toBe('istanbul');
    expect(foldTr('Istanbul')).toBe('istanbul');
    expect(foldTr('Gümrük Yönetmeliği')).toBe('gumruk yonetmeligi');
    expect(foldTr('Hakkâri')).toBe('hakkari');
    expect(foldTr('ŞIRNAK')).toBe('sirnak');
  });

  it('matches all tokens regardless of accents', () => {
    expect(matchesAllTokens('Gümrük Kanunu Uygulama Yönetmeliği', tokenize('gumruk yonetmelik'))).toBe(true);
    expect(matchesAllTokens('Gümrük Kanunu', tokenize('gumruk tebliğ'))).toBe(false);
  });
});

describe('dates', () => {
  it('normalizes ISO and Turkish formats', () => {
    expect(normalizeDate('2026-11-27')).toBe('2026-11-27');
    expect(normalizeDate('27.11.2026')).toBe('2026-11-27');
    expect(normalizeDate('1/2/2026')).toBe('2026-02-01');
    expect(normalizeDate('2026-02-30')).toBeNull();
    expect(normalizeDate('yesterday')).toBeNull();
  });

  it('does calendar arithmetic', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(dayNameTr('2026-11-27')).toBe('Cuma');
  });

  it('uses Istanbul time for "today"', () => {
    // 2026-11-27 22:30 UTC is already 28 Nov in Istanbul (UTC+3).
    expect(todayInTurkey(new Date('2026-11-27T22:30:00Z'))).toBe('2026-11-28');
    expect(todayInTurkey(new Date('2026-11-27T20:59:00Z'))).toBe('2026-11-27');
  });
});
