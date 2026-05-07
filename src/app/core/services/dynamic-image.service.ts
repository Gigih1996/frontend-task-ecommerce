import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export type ImageFormat = 'png' | 'jpeg' | 'webp';

/** Fonts supported by dummyjson `/image` endpoint. */
export type ImageFont =
  | 'bitter'
  | 'cairo'
  | 'comfortaa'
  | 'cookie'
  | 'dosis'
  | 'gotham'
  | 'lobster'
  | 'marhey'
  | 'pacifico'
  | 'poppins'
  | 'quicksand'
  | 'qwigley'
  | 'satisfy'
  | 'ubuntu';

export interface PlaceholderOptions {
  /** width in px */
  width?: number;
  /** height in px (omit to make it square) */
  height?: number;
  /** background color, hex without # — e.g. '008080' */
  bg?: string;
  /** text color, hex without # — e.g. 'ffffff'. Requires `bg`. */
  color?: string;
  /** caption baked into the image */
  text?: string;
  format?: ImageFormat;
  fontFamily?: ImageFont;
  fontSize?: number;
}

export interface IdenticonOptions {
  /** size in px — default 128 */
  size?: number;
  type?: 'png' | 'svg';
}

/**
 * Builds URLs for dummyjson's `/image` (placeholder) and `/icon` (identicon)
 * endpoints. Returned URLs go straight into `<img src="">` — no fetch needed.
 *
 * Examples:
 *   `placeholder({ width: 400, height: 200, text: 'Hello' })`
 *   → https://dummyjson.com/image/400x200?text=Hello
 *
 *   `identicon('user@example.com')`
 *   → https://dummyjson.com/icon/user%40example.com/128
 */
@Injectable({ providedIn: 'root' })
export class DynamicImageService {
  private readonly base = environment.apiUrl;
  private readonly paths = API_ENDPOINTS.images;

  placeholder(opts: PlaceholderOptions = {}): string {
    const {
      width = 400,
      height,
      bg,
      color,
      text,
      format,
      fontFamily,
      fontSize,
    } = opts;
    const size = height ? `${width}x${height}` : `${width}`;

    let path: string;
    if (bg && color) path = this.paths.placeholderBgColor(size, bg, color);
    else if (bg) path = this.paths.placeholderBg(size, bg);
    else path = this.paths.placeholder(size);

    const params = new URLSearchParams();
    if (text) params.set('text', text);
    if (format) params.set('type', format);
    if (fontFamily) params.set('fontFamily', fontFamily);
    if (fontSize) params.set('fontSize', String(fontSize));

    const qs = params.toString();
    return `${this.base}${path}${qs ? '?' + qs : ''}`;
  }

  identicon(hash: string, opts: IdenticonOptions = {}): string {
    const { size = 128, type = 'png' } = opts;
    const path = this.paths.identicon(hash, size);
    const qs = type === 'svg' ? '?type=svg' : '';
    return `${this.base}${path}${qs}`;
  }

  /**
   * Helper: derive a stable identicon URL from any user-ish input.
   * Uses email if available, otherwise name. Falls back to 'user'.
   */
  identiconFor(
    user: { email?: string; username?: string; name?: string } | null | undefined,
    size = 128
  ): string {
    const seed =
      user?.email?.toLowerCase() ||
      user?.username?.toLowerCase() ||
      user?.name?.toLowerCase() ||
      'user';
    return this.identicon(seed, { size });
  }
}
