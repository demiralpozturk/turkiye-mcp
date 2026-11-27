import { describe, expect, it } from 'vitest';
import { HttpClient, HttpError, USER_AGENT } from '../src/lib/http.js';

function fakeFetch(responses: Record<string, { status: number; body: string }>) {
  const calls: string[] = [];
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    expect((init?.headers as Record<string, string>)['User-Agent']).toBe(USER_AGENT);
    const r = responses[url];
    if (!r) return new Response('not found', { status: 404 });
    return new Response(r.body, { status: r.status });
  }) as typeof fetch;
  return { impl, calls };
}

describe('HttpClient', () => {
  it('caches successful responses', async () => {
    const { impl, calls } = fakeFetch({ 'https://x.test/a': { status: 200, body: '{"ok":true}' } });
    const http = new HttpClient({ fetchImpl: impl });
    expect(await http.getJson('https://x.test/a', { ttlMs: 60_000 })).toEqual({ ok: true });
    expect(await http.getJson('https://x.test/a', { ttlMs: 60_000 })).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
  });

  it('de-duplicates concurrent requests', async () => {
    const { impl, calls } = fakeFetch({ 'https://x.test/a': { status: 200, body: 'hi' } });
    const http = new HttpClient({ fetchImpl: impl });
    const [a, b] = await Promise.all([
      http.getText('https://x.test/a', { ttlMs: 1 }),
      http.getText('https://x.test/a', { ttlMs: 1 }),
    ]);
    expect(a).toBe('hi');
    expect(b).toBe('hi');
    expect(calls).toHaveLength(1);
  });

  it('throws HttpError and remembers 404s when asked to', async () => {
    const { impl, calls } = fakeFetch({});
    const http = new HttpClient({ fetchImpl: impl });
    const opts = { ttlMs: 1000, notFoundTtlMs: 1000 };
    await expect(http.getText('https://x.test/missing', opts)).rejects.toBeInstanceOf(HttpError);
    await expect(http.getText('https://x.test/missing', opts)).rejects.toMatchObject({ status: 404 });
    expect(calls).toHaveLength(1);
  });

  it('wraps network failures with the URL', async () => {
    const impl = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const http = new HttpClient({ fetchImpl: impl });
    await expect(http.getText('https://x.test/down', { ttlMs: 1 })).rejects.toThrow(/x\.test\/down.*fetch failed/);
  });
});
