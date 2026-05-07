import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Endpoints that require the Bearer token + cookies.
 * DummyJSON product endpoints are public — sending Authorization on them
 * triggers a CORS preflight that the server rejects (status 0).
 */
const PROTECTED_PATTERNS = [
  /\/auth\/me\b/,
  /\/auth\/refresh\b/,
  /\/users\/me\b/,
  /\/carts\/user\b/,
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!PROTECTED_PATTERNS.some((re) => re.test(req.url))) {
    return next(req);
  }

  const auth = inject(AuthService);

  // Always include cookies for protected endpoints (DummyJSON also reads
  // accessToken/refreshToken from cookies as a fallback).
  let cloned = req.clone({ withCredentials: true });

  // Only attach Bearer if the session is from DummyJSON — Google JWTs would
  // be rejected with 401 and would invalidate our local session.
  const token = auth.getToken();
  if (token && auth.getProvider() === 'dummyjson') {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(cloned);
};
