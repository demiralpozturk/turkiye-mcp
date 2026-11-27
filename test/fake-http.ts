import { HttpClient } from '../src/lib/http.js';

/** An HttpClient backed by a URL → body map; unknown URLs return 404. Records every request. */
export function fakeHttp(routes: Record<string, string>) {
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    const body = routes[url];
    return body === undefined ? new Response('Not Found', { status: 404 }) : new Response(body, { status: 200 });
  }) as typeof fetch;
  return { http: new HttpClient({ fetchImpl }), calls };
}
