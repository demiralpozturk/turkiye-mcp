import { describe, expect, it } from 'vitest';
import { connectClient, textOf } from './helpers.js';

const now = () => new Date('2026-11-27T09:00:00Z');

describe('offline tools over MCP', () => {
  it('registers the offline tools with read-only annotations', async () => {
    const { client } = await connectClient({ now });
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(['resmi_tatiller', 'il_ilce', 'tckn_dogrula', 'vkn_dogrula', 'iban_dogrula']));
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint).toBe(true);
      expect(t.description).toBeTruthy();
    }
    await client.close();
  });

  it('tckn_dogrula validates without echoing the full number', async () => {
    const { client } = await connectClient({ now });
    const res = await client.callTool({ name: 'tckn_dogrula', arguments: { tckn: '10000000146' } });
    const body = JSON.parse(textOf(res));
    expect(body).toMatchObject({ type: 'TCKN', valid: true, masked: '100******46' });
    expect(textOf(res)).not.toContain('10000000146');
    expect(body.note).toMatch(/no lookup/);
    await client.close();
  });

  it('iban_dogrula labels the bank', async () => {
    const { client } = await connectClient({ now });
    const res = await client.callTool({ name: 'iban_dogrula', arguments: { iban: 'TR33 0006 1005 1978 6457 8413 26' } });
    expect(JSON.parse(textOf(res))).toMatchObject({ valid: true, details: { bankCode: '00061' } });
    await client.close();
  });

  it('resmi_tatiller checks a date and reports the next holiday', async () => {
    const { client } = await connectClient({ now });
    const res = await client.callTool({ name: 'resmi_tatiller', arguments: { tarih: '27.05.2026' } });
    const body = JSON.parse(textOf(res));
    expect(body.year).toBe(2026);
    expect(body.checkedDate).toMatchObject({ date: '2026-05-27', status: 'resmi_tatil' });
    expect(body.nextHoliday.date).toBe('2027-01-01');
    await client.close();
  });

  it('resmi_tatiller rejects an invalid date as a tool error', async () => {
    const { client } = await connectClient({ now });
    const res = await client.callTool({ name: 'resmi_tatiller', arguments: { tarih: '31.02.2026' } });
    expect(res.isError).toBe(true);
    await client.close();
  });

  it('il_ilce answers province, district and region queries', async () => {
    const { client } = await connectClient({ now });
    const byPlate = JSON.parse(textOf(await client.callTool({ name: 'il_ilce', arguments: { plaka: 35 } })));
    expect(byPlate).toMatchObject({ il: 'İzmir', plaka: '35', ilceSayisi: 30 });

    const byDistrict = JSON.parse(textOf(await client.callTool({ name: 'il_ilce', arguments: { sorgu: 'Kadıköy' } })));
    expect(byDistrict.districts[0]).toMatchObject({ il: 'İstanbul' });

    const region = JSON.parse(textOf(await client.callTool({ name: 'il_ilce', arguments: { bolge: 'Ege Bölgesi' } })));
    expect(region.count).toBe(8);
    await client.close();
  });
});
