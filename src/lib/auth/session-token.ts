/**
 * Stateless admin session tokens: `base64url(payload).base64url(HMAC-SHA256)`.
 * Uses Web Crypto only, so the same code runs in `proxy.ts` and on the server.
 *
 * The signing key is derived from AUTH_SECRET *and* ADMIN_PASSWORD, so
 * changing either one immediately invalidates every existing session.
 */

export const SESSION_COOKIE = "waa_admin_session";
/** Secrets shorter than this are treated as "not configured". */
export const MIN_AUTH_SECRET_LENGTH = 32;
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

/**
 * Key material for signing sessions, or null when admin auth isn't
 * configured (missing or too-short secret/password) — callers must then deny access.
 */
export function sessionSigningKey(secret: string | undefined, password: string | undefined): string | null {
  if (!secret || secret.length < MIN_AUTH_SECRET_LENGTH || !password || password.length < MIN_ADMIN_PASSWORD_LENGTH) return null;
  return `${secret}\u0000${password}`;
}
/** 12 hours. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

interface SessionPayload {
  v: 1;
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const iat = Math.floor(now / 1000);
  const payload: SessionPayload = { v: 1, iat, exp: iat + SESSION_MAX_AGE_SECONDS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** True only for an untampered, unexpired token signed with `secret`. */
export async function verifySessionToken(token: string | undefined, secret: string, now = Date.now()): Promise<boolean> {
  if (!token || token.length > 512) return false;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return false;
  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromBase64Url(signature), encoder.encode(body));
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Partial<SessionPayload>;
    return payload.v === 1 && typeof payload.exp === "number" && payload.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}
