import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;
const MAX_DELAY_MS = 8000;
const RETRYABLE_STATUSES = new Set([429, 503]);
/**
 * Only retry idempotent reads. Retrying POST/PUT/PATCH/DELETE on 429 wastes
 * quota and risks duplicate writes — let the caller handle write failures.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD']);

/**
 * Retry GET/HEAD on 429/503 with exponential backoff, honoring the server's
 * `Retry-After` header when present.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (!SAFE_METHODS.has(req.method.toUpperCase())) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (err, retryIndex) => {
        if (
          !(err instanceof HttpErrorResponse) ||
          !RETRYABLE_STATUSES.has(err.status)
        ) {
          return throwError(() => err);
        }

        const retryAfter = err.headers.get('Retry-After');
        let delayMs = Math.min(
          BASE_DELAY_MS * Math.pow(2, retryIndex),
          MAX_DELAY_MS
        );

        if (retryAfter) {
          const asNum = Number(retryAfter);
          if (!Number.isNaN(asNum)) {
            delayMs = asNum * 1000;
          } else {
            const date = Date.parse(retryAfter);
            if (!Number.isNaN(date)) delayMs = Math.max(0, date - Date.now());
          }
        }

        return timer(delayMs);
      },
    })
  );
};
