import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { catchError, of, tap, throwError } from 'rxjs';

/**
 * GET cache to reduce hits against rate-limited public APIs (DummyJSON
 * returns 429 if you spam it). Two layers:
 *   1. In-memory Map for instant hits within a session.
 *   2. localStorage mirror so reloads don't trigger fresh fetches.
 *
 * Plus stale-while-revalidate: if the live request fails with 429 / network
 * error, fall back to the last successful cached body — UI keeps working.
 */

interface CacheEntry {
  expiresAt: number;
  status: number;
  url: string;
  body: unknown;
  /** Last time we received this from the network — used as a 'stale anchor'. */
  cachedAt: number;
}

const STORAGE_PREFIX = 'shopease_httpcache:';
/**
 * DummyJSON enforces a 100 req / 30s rate limit per IP. To stay well under
 * it during development, we cache aggressively. Dev data rarely changes
 * during a session — 1 hour for product/recipe lists, 6 hours for static
 * lookups (categories, tags). Use the window helper to force a refresh.
 */
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const LONG_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
/** If a request fails, serve cache up to this age even if expired. */
const STALE_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const SHORT_TTL_PATTERNS = [
  /\/products(\?|$)/,
  /\/products\/\d+$/,
  /\/products\/search/,
  /\/products\/category\//,
  /\/recipes(\?|$)/,
  /\/recipes\/\d+$/,
  /\/recipes\/search/,
  /\/recipes\/tag\//,
  /\/recipes\/meal-type\//,
];

const LONG_TTL_PATTERNS = [
  /\/products\/categories$/,
  /\/products\/category-list$/,
  /\/recipes\/tags$/,
];

/**
 * These endpoints are cached in memory only (not localStorage) so that a
 * page refresh always triggers a real network request. This lets users see
 * live data in DevTools without manual cache clearing.
 */
const MEMORY_ONLY_PATTERNS = [
  /\/products(\?|$)/,
  /\/products\/\d+$/,
  /\/products\/search/,
  /\/products\/category\//,
];

const memCache = new Map<string, CacheEntry>();

function ttlFor(url: string): number | null {
  if (LONG_TTL_PATTERNS.some((re) => re.test(url))) return LONG_TTL_MS;
  if (SHORT_TTL_PATTERNS.some((re) => re.test(url))) return DEFAULT_TTL_MS;
  return null;
}

function read(key: string): CacheEntry | null {
  const mem = memCache.get(key);
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    memCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function isMemoryOnly(url: string): boolean {
  return MEMORY_ONLY_PATTERNS.some((re) => re.test(url));
}

function write(key: string, entry: CacheEntry): void {
  memCache.set(key, entry);
  if (isMemoryOnly(key)) return; // skip localStorage — refresh clears memory cache
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota exceeded — drop the oldest 25% of entries from localStorage
    pruneStorage();
  }
}

/**
 * Expose a global helper for dev: paste `clearShopEaseCache()` in DevTools
 * console to wipe both memory and localStorage cache, forcing fresh fetches.
 */
declare global {
  interface Window {
    clearShopEaseCache?: () => number;
  }
}

if (typeof window !== 'undefined' && !window.clearShopEaseCache) {
  window.clearShopEaseCache = () => {
    memCache.clear();
    let removed = 0;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(k);
          removed++;
        }
      }
    } catch {
      // best-effort
    }
    console.info(`[ShopEase] cleared ${removed} cache entries`);
    return removed;
  };
}

function pruneStorage(): void {
  try {
    const entries: [string, CacheEntry][] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(STORAGE_PREFIX)) continue;
      const v = localStorage.getItem(k);
      if (!v) continue;
      try {
        entries.push([k, JSON.parse(v) as CacheEntry]);
      } catch {
        localStorage.removeItem(k);
      }
    }
    entries
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
      .slice(0, Math.ceil(entries.length / 4))
      .forEach(([k]) => localStorage.removeItem(k));
  } catch {
    // best-effort
  }
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);

  const ttl = ttlFor(req.url);
  if (ttl === null) return next(req);

  const key = req.urlWithParams;
  const cached = read(key);
  const now = Date.now();

  // Fresh hit → short-circuit, no network.
  if (cached && cached.expiresAt > now) {
    return of(
      new HttpResponse({
        body: cached.body,
        status: cached.status || 200,
        url: cached.url,
      })
    );
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        write(key, {
          expiresAt: now + ttl,
          status: event.status,
          url: event.url ?? req.url,
          body: event.body,
          cachedAt: now,
        });
      }
    }),
    catchError((err: HttpErrorResponse) => {
      const isRetryable = err.status === 429 || err.status === 0;
      // Stale-while-revalidate: serve last cached body even if expired,
      // but only up to STALE_GRACE_MS to avoid showing very ancient data.
      if (
        isRetryable &&
        cached &&
        now - cached.cachedAt < STALE_GRACE_MS
      ) {
        return of(
          new HttpResponse({
            body: cached.body,
            status: 200,
            url: cached.url,
          })
        );
      }
      return throwError(() => err);
    })
  );
};
