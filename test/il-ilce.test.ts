import { describe, expect, it } from 'vitest';
import { ILLER } from '../src/data/il-ilce.js';
import { foldTr } from '../src/lib/text.js';
import { findDistricts, findProvince } from '../src/tools/il-ilce.js';

describe('il-ilce dataset', () => {
  it('has 81 provinces with plate codes 1..81 in order', () => {
    expect(ILLER).toHaveLength(81);
    ILLER.forEach((p, i) => expect(p.plaka).toBe(i + 1));
  });

  it('has 973 districts in total, 30 metropolitan provinces and 51 "Merkez" districts', () => {
    expect(ILLER.reduce((n, p) => n + p.ilceler.length, 0)).toBe(973);
    expect(ILLER.filter((p) => p.buyuksehir)).toHaveLength(30);
    const merkez = ILLER.filter((p) => p.ilceler.includes('Merkez'));
    expect(merkez).toHaveLength(51);
    expect(merkez.every((p) => !p.buyuksehir)).toBe(true);
  });

  it('has no duplicate districts inside a province', () => {
    for (const p of ILLER) expect(new Set(p.ilceler.map(foldTr)).size).toBe(p.ilceler.length);
  });

  it('spot-checks well-known facts', () => {
    expect(findProvince(34)?.il).toBe('İstanbul');
    expect(findProvince(34)?.ilceler).toHaveLength(39);
    expect(findProvince(34)?.ilceler).toContain('Eyüpsultan');
    expect(findProvince(6)?.ilceler).toHaveLength(25);
    expect(findProvince(69)?.ilceler).toHaveLength(3); // Bayburt
    expect(findProvince('Aksaray')?.ilceler).toContain('Sultanhanı');
    expect(findProvince('Hakkari')?.ilceler).toContain('Derecik');
    expect(findProvince(42)?.il).toBe('Konya');
    expect(findProvince(64)?.il).toBe('Uşak');
    expect(findProvince(81)?.il).toBe('Düzce');
  });

  it('counts provinces per region like the 7-region classification', () => {
    const count = (b: string) => ILLER.filter((p) => p.bolge === b).length;
    expect(count('Marmara')).toBe(11);
    expect(count('Ege')).toBe(8);
    expect(count('Akdeniz')).toBe(8);
    expect(count('İç Anadolu')).toBe(13);
    expect(count('Karadeniz')).toBe(18);
    expect(count('Doğu Anadolu')).toBe(14);
    expect(count('Güneydoğu Anadolu')).toBe(9);
  });
});

describe('lookups', () => {
  it('finds provinces by plate string, accent-insensitive name and aliases', () => {
    expect(findProvince('06')?.il).toBe('Ankara');
    expect(findProvince('ISTANBUL')?.il).toBe('İstanbul');
    expect(findProvince('sanliurfa')?.plaka).toBe(63);
    expect(findProvince('Urfa')?.plaka).toBe(63);
    expect(findProvince('Afyon')?.plaka).toBe(3);
    expect(findProvince('Maraş')?.plaka).toBe(46);
    expect(findProvince('İçel')?.plaka).toBe(33);
    expect(findProvince('Hakkâri')?.plaka).toBe(30);
    expect(findProvince('Atlantis')).toBeUndefined();
  });

  it('finds districts that exist in several provinces', () => {
    const r = findDistricts('golbasi');
    expect(r.exact).toBe(true);
    expect(r.matches.map((m) => m.il).sort()).toEqual(['Adıyaman', 'Ankara']);
    expect(findDistricts('Kemalpaşa').matches.map((m) => m.il).sort()).toEqual(['Artvin', 'İzmir']);
  });

  it('falls back to prefix matches', () => {
    const r = findDistricts('kadik');
    expect(r.exact).toBe(false);
    expect(r.matches[0]).toMatchObject({ ilce: 'Kadıköy', il: 'İstanbul', plaka: '34' });
  });
});
