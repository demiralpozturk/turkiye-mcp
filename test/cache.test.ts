import { describe, expect, it } from 'vitest';
import { TtlCache } from '../src/lib/cache.js';

describe('TtlCache', () => {
  it('returns values until they expire', () => {
    let now = 1_000;
    const cache = new TtlCache<string>(10, () => now);
    cache.set('a', 'x', 500);
    expect(cache.get('a')).toBe('x');
    now += 499;
    expect(cache.get('a')).toBe('x');
    now += 1;
    expect(cache.get('a')).toBeUndefined();
  });

  it('evicts the least recently used entry when full', () => {
    const cache = new TtlCache<number>(2);
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.get('a'); // a is now most recent
    cache.set('c', 3, 60_000);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
  });

  it('ignores non-positive TTLs', () => {
    const cache = new TtlCache<number>();
    cache.set('a', 1, 0);
    expect(cache.size).toBe(0);
  });
});
