import { TtlCache } from './cache.js';
import { VERSION } from '../version.js';

export const USER_AGENT = `turkiye-mcp/${VERSION} (+https://github.com/demiralpozturk/turkiye-mcp)`;

/** Default per-request timeout. Upstream sources are small static files. */
export const DEFAULT_TIMEOUT_MS = 10_000;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
  }
}

export interface GetOptions {
  /** How long a successful response is cached. */
  ttlMs: number;
  /** How long a 404 is remembered (avoids re-asking for a file that does not exist yet). */
  notFoundTtlMs?: number;
}

export interface HttpClientOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  cache?: TtlCache<string | HttpError>;
}

/**
 * Polite HTTP client: one identifying User-Agent, hard timeout, response cache,
 * negative cache for 404s and de-duplication of concurrent identical requests.
 */
export class HttpClient {
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly cache: TtlCache<string | HttpError>;
  private readonly inflight = new Map<string, Promise<string>>();

  constructor(options: HttpClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.cache = options.cache ?? new TtlCache<string | HttpError>(200);
  }

  async getText(url: string, options: GetOptions): Promise<string> {
    const cached = this.cache.get(url);
    if (cached instanceof HttpError) throw cached;
    if (cached !== undefined) return cached;

    const pending = this.inflight.get(url);
    if (pending) return pending;

    const request = this.fetchText(url, options).finally(() => this.inflight.delete(url));
    this.inflight.set(url, request);
    return request;
  }

  async getJson<T>(url: string, options: GetOptions): Promise<T> {
    const text = await this.getText(url, options);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON from ${url}`);
    }
  }

  private async fetchText(url: string, options: GetOptions): Promise<string> {
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Request failed for ${url}: ${reason}`);
    }

    if (!response.ok) {
      const httpError = new HttpError(response.status, url);
      if (response.status === 404 && options.notFoundTtlMs) {
        this.cache.set(url, httpError, options.notFoundTtlMs);
      }
      // Drain the body so the connection can be reused.
      await response.arrayBuffer().catch(() => undefined);
      throw httpError;
    }

    const text = await response.text();
    this.cache.set(url, text, options.ttlMs);
    return text;
  }
}
