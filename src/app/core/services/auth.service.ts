import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  AuthUser,
  RefreshRequest,
  RefreshResponse,
} from '../models/auth.model';
import { GoogleJwtPayload } from '../models/google.model';
import { GoogleAuthService } from './google-auth.service';
import { CartStateService } from './cart-state.service';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

const TOKEN_KEY = 'shopease_token';
const REFRESH_KEY = 'shopease_refresh';
const USER_KEY = 'shopease_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private google = inject(GoogleAuthService);
  private cart = inject(CartStateService);

  private readonly api = environment.apiUrl;

  private readonly _user = signal<AuthUser | null>(this.readUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  /**
   * POST /auth/login
   * DummyJSON expects { username, password, expiresInMins? }.
   * `withCredentials: true` is the Angular equivalent of fetch's
   * `credentials: 'include'` — required so the server can set the
   * accessToken / refreshToken cookies.
   *
   * Sample creds: emilys / emilyspass
   */
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${this.api}${API_ENDPOINTS.auth.login}`,
        {
          username: payload.username,
          password: payload.password,
          expiresInMins: payload.expiresInMins ?? 60,
        },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => this.persistSession(res)),
        catchError((err) => {
          if (err?.status === 429) {
            const retryAfter = this.parseRetryAfterSeconds(
              err?.headers?.get?.('Retry-After')
            );
            const wrapped = new Error(
              retryAfter
                ? `Server sedang sibuk. Coba lagi dalam ${retryAfter} detik.`
                : 'Server sedang sibuk. Tunggu sebentar lalu coba lagi.'
            );
            (wrapped as Error & { retryAfter?: number }).retryAfter =
              retryAfter ?? 30;
            return throwError(() => wrapped);
          }
          const message =
            err?.error?.message ||
            (err?.status === 400 || err?.status === 401
              ? 'Invalid username or password'
              : 'Login failed. Please try again.');
          return throwError(() => new Error(message));
        })
      );
  }

  private parseRetryAfterSeconds(value: string | null): number | null {
    if (!value) return null;
    const asNum = Number(value);
    if (!Number.isNaN(asNum)) return Math.ceil(asNum);
    const date = Date.parse(value);
    if (!Number.isNaN(date)) {
      return Math.max(0, Math.ceil((date - Date.now()) / 1000));
    }
    return null;
  }

  /**
   * GET /auth/me — verify the current session and refresh local user state.
   * Bearer token is attached by the auth interceptor.
   * Only meaningful for dummyjson sessions; Google sessions are skipped.
   */
  me(): Observable<AuthUser> {
    return this.http
      .get<LoginResponse>(`${this.api}${API_ENDPOINTS.auth.me}`, {
        withCredentials: true,
      })
      .pipe(
        map((res) => ({
          id: res.id,
          username: res.username,
          email: res.email,
          firstName: res.firstName,
          lastName: res.lastName,
          image: res.image,
          provider: 'dummyjson' as const,
        })),
        tap((user) => {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this._user.set(user);
        }),
        catchError((err) => {
          if (err?.status === 401) this.logout();
          return throwError(() => err);
        })
      );
  }

  /**
   * POST /auth/refresh — extend the session and rotate tokens.
   * If `refreshToken` is omitted, the server falls back to the cookie.
   */
  refresh(payload: RefreshRequest = {}): Observable<RefreshResponse> {
    const body: RefreshRequest = {
      refreshToken:
        payload.refreshToken ??
        localStorage.getItem(REFRESH_KEY) ??
        undefined,
      expiresInMins: payload.expiresInMins ?? 60,
    };
    return this.http
      .post<RefreshResponse>(
        `${this.api}${API_ENDPOINTS.auth.refresh}`,
        body,
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.accessToken);
          localStorage.setItem(REFRESH_KEY, res.refreshToken);
        })
      );
  }

  /**
   * Sign in via Google Identity Services. We don't hit /auth/login on Google,
   * so the Google JWT lives in TOKEN_KEY only as a marker — interceptor never
   * sends it to dummyjson endpoints (handled in auth.interceptor.ts).
   */
  loginWithGoogle(payload: GoogleJwtPayload, rawCredential: string): AuthUser {
    const user: AuthUser = {
      id: 0,
      username: payload.email.split('@')[0] ?? payload.sub,
      email: payload.email,
      firstName: payload.given_name || payload.name,
      lastName: payload.family_name || '',
      image: payload.picture,
      provider: 'google',
    };
    localStorage.setItem(TOKEN_KEY, rawCredential);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
    return user;
  }

  logout(): void {
    // 1. Clear local cart state (signal + its own localStorage entry).
    this.cart.clear();

    // 2. Wipe every `shopease_*` key from BOTH localStorage and
    //    sessionStorage — auth tokens, http cache, Google OAuth nonce/state,
    //    and any future namespaced keys. Iterate backwards because
    //    removeItem shifts indexes.
    try {
      for (const store of [localStorage, sessionStorage]) {
        for (let i = store.length - 1; i >= 0; i--) {
          const key = store.key(i);
          if (key && key.startsWith('shopease_')) {
            store.removeItem(key);
          }
        }
      }
    } catch {
      // best-effort
    }

    // 3. Drop in-memory http cache (memCache map inside cache.interceptor).
    window.clearShopEaseCache?.();

    // 4. Reset auth state, sign out Google, redirect.
    this._user.set(null);
    this.google.signOut();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getProvider(): 'dummyjson' | 'google' | null {
    return this._user()?.provider ?? null;
  }

  private persistSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);

    const user: AuthUser = {
      id: res.id,
      username: res.username,
      email: res.email,
      firstName: res.firstName,
      lastName: res.lastName,
      image: res.image,
      provider: 'dummyjson',
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
