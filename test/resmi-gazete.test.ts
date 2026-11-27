import { describe, expect, it } from 'vitest';
import { RG_DATA, dayUrl, resolveCategory, searchItems, type RgKategori, type RgSon90 } from '../src/tools/resmi-gazete.js';
import { fakeHttp } from './fake-http.js';
import { connectClient, fixture, textOf } from './helpers.js';

const son90 = JSON.parse(fixture('rg-son90.json')) as RgSon90;
const categories = JSON.parse(fixture('rg-kategoriler.json')) as RgKategori[];

const routes = {
  [`${RG_DATA}latest.json`]: fixture('rg-2026-11-27.json'),
  [`${RG_DATA}2026/11/27.json`]: fixture('rg-2026-11-27.json'),
  [`${RG_DATA}son90.json`]: fixture('rg-son90.json'),
  [`${RG_DATA}kategoriler.json`]: fixture('rg-kategoriler.json'),
  [`${RG_DATA}index.json`]: fixture('rg-index.json'),
};

describe('search helpers', () => {
  it('builds daily file URLs', () => {
    expect(dayUrl('2026-11-01')).toBe('https://demiralpozturk.github.io/resmi-gazete-takip/data/2026/11/01.json');
  });

  it('resolves categories by code or accent-insensitive name', () => {
    expect(resolveCategory('gumruk', categories)?.kod).toBe('gumruk');
    expect(resolveCategory('Gümrük', categories)?.kod).toBe('gumruk');
    expect(resolveCategory('ithalat', categories)?.kod).toBe('dis-ticaret');
    expect(resolveCategory('uzay', categories)).toBeUndefined();
  });

  it('matches all words without caring about Turkish characters, newest first', () => {
    const r = searchItems(son90.maddeler, { query: 'gumruk isbirligi' });
    expect(r).toHaveLength(1);
    expect(r[0]?.baslik).toMatch(/Gümrük İşbirliği Komitesinin/);

    const anayasa = searchItems(son90.maddeler, { query: 'anayasa mahkemesi' });
    expect(anayasa.length).toBeGreaterThan(3);
    expect(anayasa.map((m) => m.tarih)).toEqual([...anayasa.map((m) => m.tarih)].sort().reverse());
  });

  it('filters by category and date range', () => {
    expect(searchItems(son90.maddeler, { category: 'gumruk' }).map((m) => m.tarih)).toEqual(['2026-11-27', '2026-10-31']);
    expect(searchItems(son90.maddeler, { category: 'gumruk', from: '2026-11-01' })).toHaveLength(1);
    expect(searchItems(son90.maddeler, { query: 'tebliğ', to: '2026-10-31' }).every((m) => m.tarih <= '2026-10-31')).toBe(true);
  });
});

describe('resmi_gazete_gunluk tool', () => {
  it('returns the latest issue with official links', async () => {
    const { http } = fakeHttp(routes);
    const { client } = await connectClient({ http });
    const body = JSON.parse(textOf(await client.callTool({ name: 'resmi_gazete_gunluk', arguments: {} })));
    expect(body.date).toBe('2026-11-27');
    expect(body.issues[0]).toMatchObject({ number: 33443, pdf: expect.stringContaining('resmigazete.gov.tr') });
    expect(body.items[0]).toMatchObject({ type: 'Milletlerarası Andlaşma', url: expect.stringMatching(/^https:\/\/www\.resmigazete\.gov\.tr\//) });
    expect(body.notes.join(' ')).toMatch(/Unofficial/);
    await client.close();
  });

  it('filters a day by category name', async () => {
    const { http } = fakeHttp(routes);
    const { client } = await connectClient({ http });
    const body = JSON.parse(textOf(await client.callTool({ name: 'resmi_gazete_gunluk', arguments: { tarih: '27.11.2026', kategori: 'Vergi' } })));
    expect(body.category).toEqual({ code: 'vergi', name: 'Vergi' });
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i: { categories: string[] }) => i.categories.includes('vergi'))).toBe(true);
    await client.close();
  });

  it('explains the covered range when a day is missing', async () => {
    const { http } = fakeHttp(routes);
    const { client } = await connectClient({ http });
    const res = await client.callTool({ name: 'resmi_gazete_gunluk', arguments: { tarih: '2020-01-01' } });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toMatch(/2026-10-30 – 2026-11-27/);
    await client.close();
  });
});

describe('resmi_gazete_ara tool', () => {
  it('searches the 90-day window', async () => {
    const { http } = fakeHttp(routes);
    const { client } = await connectClient({ http });
    const body = JSON.parse(
      textOf(await client.callTool({ name: 'resmi_gazete_ara', arguments: { sorgu: 'ithalatta haksız rekabet' } })),
    );
    expect(body.totalMatches).toBe(1);
    expect(body.results[0]).toMatchObject({ date: '2026-11-26', type: 'Tebliğ', institution: 'Ticaret Bakanlığı' });
    expect(body.coverage).toEqual({ from: '2026-10-31', to: '2026-11-27' });
    await client.close();
  });

  it('requires a query or a category', async () => {
    const { http } = fakeHttp(routes);
    const { client } = await connectClient({ http });
    const res = await client.callTool({ name: 'resmi_gazete_ara', arguments: {} });
    expect(res.isError).toBe(true);
    await client.close();
  });
});
