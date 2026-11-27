import { z } from 'zod';
import type { ToolRegistrar } from '../context.js';
import { FAST_KATILIMCILARI } from '../data/banka-kodlari.js';
import { jsonResult } from '../lib/result.js';

/**
 * Offline checksum validators for Turkish identifiers.
 *
 * IMPORTANT: these functions only check the published check-digit algorithms.
 * They never contact NVİ/KPS, GİB or any bank, and they cannot tell whether a
 * number actually belongs to a real person, company or account.
 */

export interface ValidationResult {
  valid: boolean;
  /** Input with spaces removed and the middle masked, so the tool never echoes a full identifier. */
  masked: string;
  errors: string[];
  details?: Record<string, unknown>;
}

const DIGITS_ONLY = /^\d+$/;

function clean(input: string): string {
  return input.replace(/[\s.-]/g, '');
}

/** Keeps the first `head` and last `tail` characters visible. */
export function mask(value: string, head = 3, tail = 2): string {
  if (value.length <= head + tail) return '*'.repeat(value.length);
  return value.slice(0, head) + '*'.repeat(value.length - head - tail) + value.slice(-tail);
}

/**
 * T.C. Kimlik No (11 digits):
 *  - first digit is not 0
 *  - d10 = ((d1+d3+d5+d7+d9) * 7 - (d2+d4+d6+d8)) mod 10
 *  - d11 = (d1 + … + d10) mod 10
 */
export function validateTckn(input: string): ValidationResult {
  const value = clean(input);
  const errors: string[] = [];
  if (!DIGITS_ONLY.test(value)) errors.push('Yalnızca rakam içermeli / must contain digits only');
  if (value.length !== 11) errors.push(`11 haneli olmalı (${value.length} hane) / must be 11 digits`);
  if (errors.length === 0) {
    const d = [...value].map(Number);
    if (d[0] === 0) errors.push('İlk hane 0 olamaz / first digit cannot be 0');
    const odd = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
    const even = d[1]! + d[3]! + d[5]! + d[7]!;
    const d10 = (((odd * 7 - even) % 10) + 10) % 10;
    if (d10 !== d[9]) errors.push('10. hane kontrolü tutmuyor / 10th digit checksum failed');
    const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
    if (d11 !== d[10]) errors.push('11. hane kontrolü tutmuyor / 11th digit checksum failed');
  }
  return { valid: errors.length === 0, masked: mask(value), errors };
}

/**
 * Vergi Kimlik No (10 digits, legal entities / companies), GİB check-digit algorithm:
 * for the first 9 digits (i = 1..9):
 *   t = (d_i + 10 - i) mod 10
 *   v = (t * 2^(10 - i)) mod 9, and v = 9 when t != 0 and v == 0
 * check digit = (10 - (Σv mod 10)) mod 10
 */
export function vknCheckDigit(first9: string): number {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const t = (Number(first9[i]) + 9 - i) % 10; // (d + 10 - position) with 1-based position
    let v = (t * 2 ** (9 - i)) % 9;
    if (t !== 0 && v === 0) v = 9;
    sum += v;
  }
  return (10 - (sum % 10)) % 10;
}

export function validateVkn(input: string): ValidationResult {
  const value = clean(input);
  const errors: string[] = [];
  if (!DIGITS_ONLY.test(value)) errors.push('Yalnızca rakam içermeli / must contain digits only');
  if (value.length !== 10) {
    errors.push(
      value.length === 11
        ? '10 haneli olmalı; 11 hane T.C. Kimlik No olabilir (şahıs işletmeleri TCKN kullanır) / must be 10 digits; 11 digits looks like a TCKN'
        : `10 haneli olmalı (${value.length} hane) / must be 10 digits`,
    );
  }
  if (errors.length === 0 && vknCheckDigit(value.slice(0, 9)) !== Number(value[9])) {
    errors.push('Kontrol hanesi tutmuyor / check digit failed');
  }
  return { valid: errors.length === 0, masked: mask(value), errors };
}

/** ISO 13616 mod-97 check on an IBAN that is already uppercase without spaces. */
export function ibanMod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const chunk = code >= 65 && code <= 90 ? String(code - 55) : ch; // A=10 … Z=35
    for (const digit of chunk) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder;
}

/**
 * IBAN validation. For TR IBANs also checks the national format:
 * TR + 2 check digits + 5-digit bank code + 1 reserve digit ("0") + 16-digit account number = 26 chars.
 */
export function validateIban(input: string): ValidationResult {
  const value = input.replace(/[\s-]/g, '').toUpperCase();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(value)) {
    errors.push('Biçim hatalı: ülke kodu + 2 kontrol hanesi + hesap / bad format: country code + 2 check digits + BBAN');
  } else if (value.length < 15 || value.length > 34) {
    errors.push(`Uzunluk 15-34 olmalı (${value.length}) / length must be 15-34`);
  }

  const country = value.slice(0, 2);
  details.country = country;

  if (country === 'TR') {
    if (value.length !== 26) errors.push(`TR IBAN 26 karakter olmalı (${value.length}) / TR IBAN must be 26 characters`);
    if (!/^TR\d{24}$/.test(value)) errors.push('TR IBAN’da ülke kodundan sonra yalnızca rakam olmalı / TR IBAN must be digits after "TR"');
    if (value.length === 26) {
      const bankCode = value.slice(4, 9);
      details.bankCode = bankCode;
      const name = bankCode.startsWith('0') ? FAST_KATILIMCILARI[bankCode.slice(1)] : undefined;
      details.bankName = name ?? null;
      if (value[9] !== '0') errors.push('Rezerv hane (10. karakter) 0 olmalı / reserve digit must be 0');
    }
  } else if (errors.length === 0) {
    details.note = 'Yalnızca mod-97 kontrol edildi; ülkeye özgü biçim kontrol edilmedi / only mod-97 checked for non-TR IBANs';
  }

  if (errors.length === 0 && ibanMod97(value) !== 1) {
    errors.push('Mod-97 kontrolü tutmuyor (yazım hatası olabilir) / mod-97 checksum failed (likely a typo)');
  }

  return { valid: errors.length === 0, masked: mask(value, 4, 4), errors, details };
}

const OFFLINE_NOTE =
  'Yalnızca algoritmik kontrol yapıldı; hiçbir kuruma (NVİ/KPS, GİB, banka) sorgu gönderilmedi. Geçerli olması, numaranın gerçek bir kişiye/kuruma/hesaba ait olduğu anlamına gelmez. / ' +
  'Checksum only; no lookup was made. A valid checksum does not mean the number exists or belongs to anyone.';

export const registerValidatorTools: ToolRegistrar = (server) => {
  const annotations = { readOnlyHint: true, idempotentHint: true, openWorldHint: false } as const;

  server.registerTool(
    'tckn_dogrula',
    {
      title: 'TCKN checksum validation',
      description:
        'T.C. Kimlik Numarasının (11 hane) algoritmik geçerliliğini kontrol eder. Kimlik sorgusu YAPMAZ; NVİ/KPS’ye bağlanmaz. ' +
        'Validates the checksum of a Turkish national ID number (TCKN, 11 digits). Offline; never looks anyone up.',
      inputSchema: {
        tckn: z.string().min(1).max(32).describe('11 haneli T.C. Kimlik No / 11-digit TCKN'),
      },
      annotations,
    },
    async ({ tckn }) => jsonResult({ type: 'TCKN', ...validateTckn(tckn), note: OFFLINE_NOTE }),
  );

  server.registerTool(
    'vkn_dogrula',
    {
      title: 'VKN checksum validation',
      description:
        'Vergi Kimlik Numarasının (10 hane) kontrol hanesini GİB algoritmasıyla doğrular. Mükellef sorgusu YAPMAZ. ' +
        'Validates the check digit of a Turkish tax ID (VKN, 10 digits). Offline; no taxpayer lookup.',
      inputSchema: {
        vkn: z.string().min(1).max(32).describe('10 haneli Vergi Kimlik No / 10-digit VKN'),
      },
      annotations,
    },
    async ({ vkn }) => jsonResult({ type: 'VKN', ...validateVkn(vkn), note: OFFLINE_NOTE }),
  );

  server.registerTool(
    'iban_dogrula',
    {
      title: 'IBAN checksum validation',
      description:
        'IBAN’ı mod-97 ile doğrular; TR IBAN’larda 26 karakter biçimini, rezerv haneyi ve banka kodunu (TCMB FAST katılımcı listesine göre banka adı) kontrol eder. Hesap sorgusu YAPMAZ. ' +
        'Validates an IBAN with mod-97; for TR IBANs also checks the 26-char structure and labels the bank code. Offline; no account lookup.',
      inputSchema: {
        iban: z.string().min(1).max(64).describe('IBAN, boşluklu veya boşluksuz / IBAN, with or without spaces (e.g. TR33 0006 1005 …)'),
      },
      annotations,
    },
    async ({ iban }) => jsonResult({ type: 'IBAN', ...validateIban(iban), note: OFFLINE_NOTE }),
  );
};
