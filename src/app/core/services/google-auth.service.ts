import { Injectable, NgZone, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { GoogleJwtPayload } from '../models/google.model';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const OAUTH_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const NONCE_KEY = 'shopease_google_nonce';
const STATE_KEY = 'shopease_google_state';
const REDIRECT_AFTER_KEY = 'shopease_redirect_after_login';

export interface RedirectCallbackResult {
  payload: GoogleJwtPayload;
  rawCredential: string;
  redirectAfterLogin: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private zone = inject(NgZone);
  private scriptLoaded?: Promise<void>;

  // ─── POPUP MODE (GIS button) ──────────────────────────────────────────────

  /** Lazy-load the Google Identity Services script once. */
  load(): Promise<void> {
    if (this.scriptLoaded) return this.scriptLoaded;
    this.scriptLoaded = new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        return reject(new Error('Document is not available.'));
      }
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${GIS_SCRIPT_SRC}"]`
      );
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('Failed to load Google Identity Services.'))
        );
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load Google Identity Services.'));
      document.head.appendChild(script);
    });
    return this.scriptLoaded;
  }

  async renderButton(
    target: HTMLElement,
    onCredential: (payload: GoogleJwtPayload, rawCredential: string) => void
  ): Promise<void> {
    this.assertConfigured();
    await this.load();
    if (!window.google) {
      throw new Error('Google Identity Services failed to initialize.');
    }

    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response) => {
        this.zone.run(() => {
          try {
            const payload = this.decodeJwt(response.credential);
            onCredential(payload, response.credential);
          } catch (err) {
            console.error('Failed to decode Google credential', err);
          }
        });
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
    });

    window.google.accounts.id.renderButton(target, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: target.clientWidth || 320,
    });
  }

  // ─── REDIRECT MODE (OAuth 2.0 implicit flow with id_token) ────────────────

  /**
   * Build the OAuth authorize URL and navigate to it.
   * Google will redirect back to /auth/callback#id_token=... on success.
   */
  signInWithRedirect(redirectAfterLogin: string = '/home'): void {
    this.assertConfigured();
    const nonce = this.randomToken();
    const state = this.randomToken();

    sessionStorage.setItem(NONCE_KEY, nonce);
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(REDIRECT_AFTER_KEY, redirectAfterLogin);

    const params = new URLSearchParams({
      client_id: environment.googleClientId,
      redirect_uri: this.callbackUrl(),
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce,
      state,
      prompt: 'select_account',
    });
    window.location.assign(`${OAUTH_AUTHORIZE_URL}?${params.toString()}`);
  }

  /**
   * Parse the URL fragment Google appended (`#id_token=...&state=...`) on the
   * callback route, validate state + nonce, and return the decoded payload.
   * Throws if the response is invalid.
   */
  consumeRedirectCallback(hash: string): RedirectCallbackResult {
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
    const params = new URLSearchParams(fragment);

    const error = params.get('error');
    if (error) {
      throw new Error(
        `Google sign-in failed: ${params.get('error_description') || error}`
      );
    }

    const idToken = params.get('id_token');
    const returnedState = params.get('state');
    if (!idToken) throw new Error('Missing id_token in Google callback.');

    const expectedState = sessionStorage.getItem(STATE_KEY);
    const expectedNonce = sessionStorage.getItem(NONCE_KEY);
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(NONCE_KEY);

    if (!expectedState || expectedState !== returnedState) {
      throw new Error('OAuth state mismatch — possible CSRF.');
    }

    const payload = this.decodeJwt(idToken);
    if (payload.aud !== environment.googleClientId) {
      throw new Error('id_token audience mismatch.');
    }
    if (expectedNonce && payload.nonce && payload.nonce !== expectedNonce) {
      throw new Error('id_token nonce mismatch.');
    }
    if (payload.exp * 1000 < Date.now()) {
      throw new Error('id_token has expired.');
    }

    const redirectAfterLogin =
      sessionStorage.getItem(REDIRECT_AFTER_KEY) || '/home';
    sessionStorage.removeItem(REDIRECT_AFTER_KEY);

    return { payload, rawCredential: idToken, redirectAfterLogin };
  }

  signOut(): void {
    window.google?.accounts.id.disableAutoSelect();
  }

  // ─── helpers ──────────────────────────────────────────────────────────────

  /**
   * The callback URL that must be registered as an Authorized redirect URI
   * in Google Cloud Console. Built from the current origin so dev/prod work.
   */
  callbackUrl(): string {
    return `${window.location.origin}/auth/callback`;
  }

  private assertConfigured(): void {
    if (
      !environment.googleClientId ||
      environment.googleClientId.startsWith('YOUR_')
    ) {
      throw new Error(
        'Google Client ID is not configured. Set googleClientId in src/environments/environment.ts.'
      );
    }
  }

  private randomToken(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private decodeJwt(token: string): GoogleJwtPayload {
    const [, payload] = token.split('.');
    if (!payload) throw new Error('Invalid Google credential.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as GoogleJwtPayload;
  }
}
