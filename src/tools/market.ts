import { z } from 'zod';
import type { ToolRegistrar } from '../context.js';
import { errorResult, jsonResult, safely } from '../lib/result.js';
import { foldTr, matchesAllTokens, tokenize } from '../lib/text.js';

/**
 * Reads the open products_data.json published by the market-scraper project
 * (https://github.com/demiralpozturk/market-scraper, MIT), which is itself built from the
 * Ministry of Trade's marketfiyati.org.tr store-level prices. This server never calls
 * marketfiyati.org.tr directly.
 */
export const MARKET_DATA_URL = 'https://demiralpozturk.github.io/market-scraper/products_data.json';

const MINUTE = 60_000;

export interface MarketPrice {
  market: string;
  price: number;
  regular_price: number;
  discount: boolean;
  discount_ratio: number;
  brand?: string;
  full_name?: string;
  store?: string;
  unit_price?: string;
  source_time?: string;
}

export interface MarketProduct {
  id: string;
  name: string;
  category: string;
  size?: string;
  prices: MarketPrice[];
  cheapest_market?: string;
  cheapest_price?: number;
  max_savings?: number;
  savings_percent?: number;
  has_discount?: boolean;
  best_deal_market?: string;
  best_deal_price?: number;
}

export interface MarketData {
  source?: string;
  source_url?: string;
  notice?: string;
  price_basis?: string;
  last_updated: string;
  price_index_time?: string;
  total_products?: number;
  markets: string[];
  products: MarketProduct[];
}

export const PRICE_NOTICE =
  'Fiyatlar T.C. Ticaret Bakanlığı marketfiyati.org.tr’nin mağaza (şube) bazlı verisidir; online fiyatlardan ve diğer şubelerden farklı olabilir. ' +
  '"regularPrice" indirimsiz normal raf fiyatı, "price" indirim dahil güncel fiyattır; en ucuz karşılaştırması normal fiyata göredir. / ' +
  'Prices are branch-level (store) prices from the Ministry of Trade’s marketfiyati.org.tr and may differ online or at other branches. ' +
  '"regularPrice" is the undiscounted price, "price" includes any discount; "cheapest" compares regular prices.';

export function resolveMarket(input: string, markets: readonly string[]): string | undefined {
  const q = foldTr(input).replace(/\s+/g, '');
  return (
    markets.find((m) => foldTr(m).replace(/\s+/g, '') === q) ??
    markets.find((m) => foldTr(m).replace(/\s+/g, '').startsWith(q))
  );
}

export interface ProductFilter {
  query?: string;
  market?: string;
  category?: string;
}

export function filterProducts(products: readonly MarketProduct[], f: ProductFilter): MarketProduct[] {
  const tokens = tokenize(f.query ?? '');
  const cat = f.category ? foldTr(f.category) : undefined;
  return products.filter((p) => {
    if (cat && !foldTr(p.category).includes(cat)) return false;
    if (f.market && !p.prices.some((x) => x.market === f.market)) return false;
    const brands = p.prices.map((x) => x.brand ?? '').join(' ');
    return matchesAllTokens(`${p.name} ${brands} ${p.category}`, tokens);
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function presentProduct(p: MarketProduct) {
  const prices = [...p.prices].sort((a, b) => a.regular_price - b.regular_price);
  const cheapest = prices[0];
  const bestDeal = [...p.prices].sort((a, b) => a.price - b.price)[0];
  return {
    name: p.name,
    category: p.category,
    size: p.size ?? null,
    cheapestByRegularPrice: cheapest ? { market: cheapest.market, regularPrice: cheapest.regular_price } : null,
    bestDealInclDiscounts: bestDeal ? { market: bestDeal.market, price: bestDeal.price, discounted: bestDeal.discount } : null,
    maxSavingsByRegularPrice: p.max_savings ?? null,
    prices: prices.map((x) => ({
      market: x.market,
      regularPrice: x.regular_price,
      price: x.price,
      discount: x.discount,
      discountPercent: x.discount ? round2((1 - x.price / x.regular_price) * 100) : 0,
      store: x.store ?? null,
      unitPrice: x.unit_price ?? null,
      sourceTime: x.source_time ?? null,
    })),
  };
}

export const registerMarketTool: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'market_fiyat_ara',
    {
      title: 'Supermarket price comparison',
      description:
        'Migros, A101, ŞOK, BİM, CarrefourSA, Hakmar gibi zincir marketlerde temel ürünlerin şube fiyatlarını karşılaştırır (süt, yağ, peynir, çay, deterjan…). ' +
        'Fiyatlar Ticaret Bakanlığı marketfiyati.org.tr’nin mağaza (şube) verisidir; normal fiyat (regularPrice) ve indirimli fiyat (price) ayrı verilir. ' +
        'Compares branch-level supermarket prices for staple products across Turkish chains; regular and discounted prices are reported separately.',
      inputSchema: {
        urun: z.string().max(100).optional().describe('Ürün adı/marka, ör. "zeytinyağı", "süt 1 lt", "Pınar" / Product or brand; empty = list'),
        market: z.string().max(30).optional().describe('Market filtresi, ör. "BİM", "Migros", "ŞOK" / Only products sold at this market'),
        kategori: z.string().max(60).optional().describe('Kategori, ör. "Temel Gıda", "Süt Ürünleri", "Temizlik" / Category'),
        limit: z.number().int().min(1).max(30).default(10).describe('En fazla ürün (1-30, varsayılan 10) / Max products'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ urun, market, kategori, limit }) =>
      safely(async () => {
        const data = await ctx.http.getJson<MarketData>(MARKET_DATA_URL, { ttlMs: 30 * MINUTE });

        let marketName: string | undefined;
        if (market !== undefined && market.trim() !== '') {
          marketName = resolveMarket(market, data.markets);
          if (!marketName) return errorResult(`Bilinmeyen market "${market}". Veri setindeki marketler: ${data.markets.join(', ')}`);
        }

        const meta = {
          lastUpdated: data.last_updated,
          sourcePriceTime: data.price_index_time ?? null,
          markets: data.markets,
          totalProducts: data.products.length,
          notice: PRICE_NOTICE,
          source: MARKET_DATA_URL,
          upstream: data.source_url ?? 'https://marketfiyati.org.tr',
        };

        const noFilter = !urun?.trim() && !kategori?.trim() && !marketName;
        if (noFilter) {
          const categories: Record<string, number> = {};
          for (const p of data.products) categories[p.category] = (categories[p.category] ?? 0) + 1;
          return jsonResult({
            ...meta,
            categories,
            products: data.products.map((p) => p.name),
            hint: 'Fiyatlar için "urun" ile arayın. / Search with "urun" to get prices.',
          });
        }

        const matches = filterProducts(data.products, { query: urun, market: marketName, category: kategori });
        const shown = matches.slice(0, limit);
        return jsonResult({
          query: { urun: urun ?? null, market: marketName ?? null, kategori: kategori ?? null },
          totalMatches: matches.length,
          returned: shown.length,
          products: shown.map(presentProduct),
          ...(matches.length === 0
            ? { hint: 'Veri seti seçili ~70 temel ürünü kapsar; daha genel bir kelime deneyin. / The dataset covers ~70 staple products; try a broader word.' }
            : {}),
          ...meta,
        });
      }),
  );
};
