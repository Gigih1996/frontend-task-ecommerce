/**
 * Decoded payload of the Google ID token (JWT) returned by Google Identity Services.
 * See: https://developers.google.com/identity/gsi/web/reference/js-reference#credential
 */
export interface GoogleJwtPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  iat: number;
  exp: number;
  /** Present only on id_tokens issued via the OAuth implicit flow (redirect mode). */
  nonce?: string;
}
