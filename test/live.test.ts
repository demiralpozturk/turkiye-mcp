/**
 * Live smoke test against the real upstream sources.
 *
 * Skipped automatically when SKIP_LIVE=1 is set or when a source cannot be reached
 * (offline machine, firewall, geo-blocking). It fails only when a source answers but
 * the answer no longer has the expected shape, which is what we want to catch.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { USER_AGENT } from '../src/lib/http.js';
import { TCMB_TODAY_URL } from '../src/tools/doviz.js';
import { MARKET_DATA_URL } from '../src/tools/market.js';
import { RG_DATA } from '../src/tools/resmi-gazete.js';
import { connectClient, textOf } from './helpers.js';

const skipAll = process.env.SKIP_LIVE === '1';
const reachable: Record<string, boolean> = {};

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) });
    await res.arrayBuffer();
    return res.ok;
  } catch {
    return false;
  }
}

describe.skipIf(skipAll)('live smoke test', () => {
  beforeAll(async () => {
    const [tcmb, rg, market] = await Promise.all([probe(TCMB_TODAY_URL), probe(`${RG_DATA}latest.json`), probe(MARKET_DATA_URL)]);
    Object.assign(reachable, { tcmb, rg, market });
  }, 40_000);

  it('doviz_kurlari returns today’s USD rate from TCMB', async (ctx) => {
    if (!reachable.tcmb) ctx.skip();
    const { client } = await connectClient();
    const body = JSON.parse(textOf(await client.callTool({ name: 'doviz_kurlari', arguments: { kodlar: ['USD', 'EUR'] } })));
    expect(body.bulletinDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const usd = body.rates.find((r: { code: string }) => r.code === 'USD');
    expect(usd.forexSelling).toBeGreaterThan(0);
    await client.close();
  });

  it('resmi_gazete_gunluk returns the latest issue', async (ctx) => {
    if (!reachable.rg) ctx.skip();
    const { client } = await connectClient();
    const body = JSON.parse(textOf(await client.callTool({ name: 'resmi_gazete_gunluk', arguments: {} })));
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.items.length).toBeGreaterThan(0);
    await client.close();
  });

  it('market_fiyat_ara returns products with regular prices', async (ctx) => {
    if (!reachable.market) ctx.skip();
    const { client } = await connectClient();
    const body = JSON.parse(textOf(await client.callTool({ name: 'market_fiyat_ara', arguments: { urun: 'süt', limit: 3 } })));
    expect(body.totalProducts).toBeGreaterThan(0);
    for (const p of body.products) expect(p.prices[0].regularPrice).toBeGreaterThan(0);
    await client.close();
  });
});
