import { describe, expect, it } from 'vitest';
import { ibanMod97, mask, validateIban, validateTckn, validateVkn, vknCheckDigit } from '../src/tools/dogrulama.js';

/** Builds a valid TCKN from 9 leading digits (independent re-implementation of the rules). */
function makeTckn(first9: string): string {
  const d = [...first9].map(Number);
  const d10 = (((d[0]! + d[2]! + d[4]! + d[6]! + d[8]!) * 7 - (d[1]! + d[3]! + d[5]! + d[7]!)) % 10 + 10) % 10;
  const d11 = (d.reduce((a, b) => a + b, 0) + d10) % 10;
  return first9 + d10 + d11;
}

/** Second, independent VKN implementation (the "t == 9 → 9" formulation). */
function vknAlt(first9: string): number {
  let sum = 0;
  for (let pos = 1; pos <= 9; pos++) {
    const t = (Number(first9[pos - 1]) + 10 - pos) % 10;
    sum += t === 9 ? 9 : (t * Math.pow(2, 10 - pos)) % 9;
  }
  return sum % 10 === 0 ? 0 : 10 - (sum % 10);
}

/** Computes TR IBAN check digits for a BBAN (independent of ibanMod97). */
function makeTrIban(bban: string): string {
  const numeric = BigInt(bban + '2927' + '00'); // T=29, R=27
  const check = 98n - (numeric % 97n);
  return `TR${String(check).padStart(2, '0')}${bban}`;
}

describe('TCKN', () => {
  it('accepts a well-known synthetic valid number', () => {
    expect(validateTckn('10000000146')).toMatchObject({ valid: true, errors: [] });
  });

  it('accepts generated numbers and rejects any single-digit change', () => {
    for (const first9 of ['123456789', '987654321', '555555555', '300000001']) {
      const tckn = makeTckn(first9);
      expect(validateTckn(tckn).valid).toBe(true);
      const last = Number(tckn[10]);
      expect(validateTckn(tckn.slice(0, 10) + ((last + 1) % 10)).valid).toBe(false);
    }
  });

  it('rejects wrong length, letters and a leading zero', () => {
    expect(validateTckn('1234567890').valid).toBe(false);
    expect(validateTckn('1000000014a').valid).toBe(false);
    const leadingZero = validateTckn('0' + makeTckn('123456789').slice(1));
    expect(leadingZero.valid).toBe(false);
    expect(leadingZero.errors.join(' ')).toMatch(/0/);
  });

  it('tolerates spaces and never echoes the full number', () => {
    const r = validateTckn('100 000 001 46');
    expect(r.valid).toBe(true);
    expect(r.masked).toBe('100******46');
  });
});

describe('VKN', () => {
  it('matches hand-computed vectors', () => {
    expect(vknCheckDigit('123456789')).toBe(0);
    expect(vknCheckDigit('000000000')).toBe(1);
    expect(validateVkn('1234567890').valid).toBe(true);
    expect(validateVkn('0000000001').valid).toBe(true);
    expect(validateVkn('1234567891').valid).toBe(false);
  });

  it('agrees with an independent implementation on many inputs', () => {
    let seed = 42;
    for (let n = 0; n < 2000; n++) {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      const first9 = String(seed % 1_000_000_000).padStart(9, '0');
      expect(vknCheckDigit(first9)).toBe(vknAlt(first9));
    }
  });

  it('hints that 11 digits is probably a TCKN', () => {
    const r = validateVkn('10000000146');
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/TCKN/);
  });
});

describe('IBAN', () => {
  it('accepts the ISO 13616 registry example for Türkiye', () => {
    const r = validateIban('TR33 0006 1005 1978 6457 8413 26');
    expect(r.valid).toBe(true);
    expect(r.details).toMatchObject({ country: 'TR', bankCode: '00061' });
    expect(r.masked).toBe('TR33******************1326');
  });

  it('labels known bank codes', () => {
    const iban = makeTrIban('00062' + '0' + '0000006299999999');
    const r = validateIban(iban);
    expect(r.valid).toBe(true);
    expect(r.details?.bankName).toBe('T. GARANTİ BANKASI A.Ş.');
  });

  it('detects typos and structural errors', () => {
    expect(validateIban('TR330006100519786457841327').valid).toBe(false); // last digit changed
    expect(validateIban('TR33000610051978645784132').valid).toBe(false); // too short
    const badReserve = makeTrIban('00010' + '1' + '1234567890123456');
    expect(ibanMod97(badReserve)).toBe(1); // checksum fine …
    expect(validateIban(badReserve).errors.join(' ')).toMatch(/[Rr]ezerv/); // … but reserve digit wrong
  });

  it('validates other countries with mod-97 only', () => {
    expect(validateIban('DE89 3704 0044 0532 0130 00').valid).toBe(true);
    expect(validateIban('GB82 WEST 1234 5698 7654 32').valid).toBe(true);
    expect(validateIban('GB82 WEST 1234 5698 7654 33').valid).toBe(false);
  });
});

describe('mask', () => {
  it('masks short values completely', () => {
    expect(mask('1234')).toBe('****');
  });
});
