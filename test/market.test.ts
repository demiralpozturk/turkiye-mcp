import { describe, expect, it } from 'vitest';
import { MARKET_DATA_URL, filterProducts, presentProduct, resolveMarket, type MarketData } from '../src/tools/market.js';
import { fakeHttp } from './fake-http.js';
import { connectClient, fixture, textOf } from './helpers.js';

const data = JSON.parse(fixture('market.json')) as MarketData;

describe('market helpers', () => {
  it('resolves market names without Turkish characters', () => {
    expect(resolveMarket('bim', data.markets)).toBe('BİM');
    expect(resolveMarket('SOK', data.markets)).toBe('ŞOK');
    expect(resolveMarket('carrefour', data.markets)).toBe('CarrefourSA');
    expect(resolveMarket('Tesco', data.markets)).toBeUndefined();
  });

  it('searches product names and brands accent-insensitively', () => {
    expect(filterProducts(data.products, { query: 'zeytinyagi' }).map((p) => p.name)).toEqual([
      'Yudum Egemden Riviera Zeytinyağı 1 Lt',
      'Yudum Egemden Riviera Zeytinyağı 2 Lt',
    ]);
    expect(filterProducts(data.products, { query: 'zeytinyağı 2 lt' })).toHaveLength(1);
    expect(filterProducts(data.products, { query: 'colgate' })).toHaveLength(1);
    expect(filterProducts(data.products, { category: 'kisisel bakim' })).toHaveLength(1);
  });

  it('keeps regular and discounted prices apart', () => {
    const colgate = data.products.find((p) => p.name.startsWith('Colgate'))!;
    const view = presentProduct(colgate);
    expect(view.cheapestByRegularPrice).toEqual({ market: 'Migros', regularPrice: 356.95 });
    expect(view.bestDealInclDiscounts).toEqual({ market: 'CarrefourSA', price: 200, discounted: true });
    const carrefour = view.prices.find((p) => p.market === 'CarrefourSA')!;
    expect(carrefour).toMatchObject({ regularPrice: 459.95, price: 200, discount: true, discountPercent: 56.52 });
    expect(carrefour.store).toBeTruthy();
  });
});

describe('market_fiyat_ara tool', () => {
  it('returns prices with the branch-level notice', async () => {
    const { http } = fakeHttp({ [MARKET_DATA_URL]: fixture('market.json') });
    const { client } = await connectClient({ http });
    const body = JSON.parse(textOf(await client.callTool({ name: 'market_fiyat_ara', arguments: { urun: 'çay', market: 'şok' } })));
    expect(body.query.market).toBe('ŞOK');
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.notice).toMatch(/şube/);
    expect(body.notice).toMatch(/branch-level/);
    expect(body.notice).toMatch(/regularPrice/);
    expect(body.lastUpdated).toBe(data.last_updated);
    await client.close();
  });

  it('lists categories when called without filters', async () => {
    const { http } = fakeHttp({ [MARKET_DATA_URL]: fixture('market.json') });
    const { client } = await connectClient({ http });
    const body = JSON.parse(textOf(await client.callTool({ name: 'market_fiyat_ara', arguments: {} })));
    expect(Object.keys(body.categories)).toContain('Temel Gıda');
    expect(body.products).toHaveLength(data.products.length);
    await client.close();
  });

  it('rejects unknown markets with the list of valid ones', async () => {
    const { http } = fakeHttp({ [MARKET_DATA_URL]: fixture('market.json') });
    const { client } = await connectClient({ http });
    const res = await client.callTool({ name: 'market_fiyat_ara', arguments: { urun: 'süt', market: 'Tesco' } });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toMatch(/Migros/);
    await client.close();
  });
});
