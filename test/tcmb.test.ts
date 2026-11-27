import { describe, expect, it } from 'vitest';
import { TCMB_TODAY_URL, archiveUrl, fetchBulletin, parseTcmbXml } from '../src/tools/doviz.js';
import { fakeHttp } from './fake-http.js';
import { connectClient, fixture, textOf } from './helpers.js';

const today = fixture('tcmb-2026-11-27.xml');
const friday20 = fixture('tcmb-2026-11-20.xml');

describe('parseTcmbXml', () => {
  it('parses the bulletin header and currencies', () => {
    const b = parseTcmbXml(today);
    expect(b.date).toBe('2026-11-27');
    expect(b.bulletinNo).toBe('2026/224');
    expect(b.rates.map((r) => r.code)).toEqual(['USD', 'EUR', 'JPY', 'KZT', 'XDR']);
  });

  it('reads numbers, units, names and empty fields', () => {
    const { rates } = parseTcmbXml(today);
    const usd = rates.find((r) => r.code === 'USD')!;
    expect(usd).toMatchObject({
      unit: 1,
      nameTr: 'ABD DOLARI',
      nameEn: 'US DOLLAR',
      forexBuying: 50.6044,
      forexSelling: 50.6955,
      banknoteBuying: 50.5689,
      banknoteSelling: 50.7716,
      crossRateUSD: null,
    });
    expect(rates.find((r) => r.code === 'JPY')?.unit).toBe(100);
    expect(rates.find((r) => r.code === 'EUR')?.crossRateOther).toBeCloseTo(1.0969);
    const xdr = rates.find((r) => r.code === 'XDR')!;
    expect(xdr.nameTr).toBe('ÖZEL ÇEKME HAKKI (SDR)'); // trailing spaces trimmed
    expect(xdr.forexSelling).toBeNull(); // <ForexSelling/>
    expect(rates.find((r) => r.code === 'KZT')?.banknoteBuying).toBeNull(); // <BanknoteBuying></BanknoteBuying>
  });

  it('rejects responses that are not a TCMB bulletin', () => {
    expect(() => parseTcmbXml('<html>Sayfa bulunamadı</html>')).toThrow(/Tarih_Date/);
  });
});

describe('archive lookup with weekend fallback', () => {
  it('builds dated archive URLs', () => {
    expect(archiveUrl('2026-11-20')).toBe('https://www.tcmb.gov.tr/kurlar/202611/20112026.xml');
    expect(archiveUrl('2026-01-02')).toBe('https://www.tcmb.gov.tr/kurlar/202601/02012026.xml');
  });

  it('walks back from Sunday to the Friday bulletin', async () => {
    const { http, calls } = fakeHttp({ [archiveUrl('2026-11-20')]: friday20 });
    const r = await fetchBulletin(http, '2026-11-22', '2026-11-27');
    expect(r.bulletin.date).toBe('2026-11-20');
    expect(r.fellBack).toBe(true);
    expect(calls).toEqual([archiveUrl('2026-11-22'), archiveUrl('2026-11-21'), archiveUrl('2026-11-20')]);
  });

  it('uses today.xml for the latest bulletin', async () => {
    const { http, calls } = fakeHttp({ [TCMB_TODAY_URL]: today });
    const r = await fetchBulletin(http, null, '2026-11-27');
    expect(r.bulletin.date).toBe('2026-11-27');
    expect(calls).toEqual([TCMB_TODAY_URL]);
  });

  it('gives up after the fallback window', async () => {
    const { http } = fakeHttp({});
    await expect(fetchBulletin(http, '2026-11-22', '2026-11-27')).rejects.toThrow(/No TCMB bulletin/);
  });
});

describe('doviz_kurlari tool', () => {
  const now = () => new Date('2026-11-27T13:00:00Z');

  it('filters currencies and reports the fallback', async () => {
    const { http } = fakeHttp({ [archiveUrl('2026-11-20')]: friday20 });
    const { client } = await connectClient({ http, now });
    const res = await client.callTool({ name: 'doviz_kurlari', arguments: { tarih: '22.11.2026', kodlar: ['usd', 'GBP'] } });
    const body = JSON.parse(textOf(res));
    expect(body).toMatchObject({ bulletinDate: '2026-11-20', requestedDate: '2026-11-22', fellBack: true, currency: 'TRY' });
    expect(body.rates.map((r: { code: string }) => r.code)).toEqual(['USD']);
    expect(body.notFound).toEqual(['GBP']);
    expect(body.notes[0]).toMatch(/2026-11-20/);
    await client.close();
  });

  it('refuses future dates and reports network errors as tool errors', async () => {
    const { http } = fakeHttp({});
    const { client } = await connectClient({ http, now });
    const future = await client.callTool({ name: 'doviz_kurlari', arguments: { tarih: '2030-01-01' } });
    expect(future.isError).toBe(true);
    const missing = await client.callTool({ name: 'doviz_kurlari', arguments: {} });
    expect(missing.isError).toBe(true);
    expect(textOf(missing)).toMatch(/HTTP 404/);
    await client.close();
  });
});
