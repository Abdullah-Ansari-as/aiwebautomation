import "server-only";
import { randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing for team members with Node's built-in scrypt (memory-hard,
 * no extra dependency). Stored format: `scrypt$N$r$p$salt$hash` (base64url).
 */

const N = 16_384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
export const MIN_TEAM_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 200;

function derive(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, keyLength, { ...options, maxmem: 64 * 1024 * 1024 }, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltText, hashText] = parts;
  const expected = Buffer.from(hashText, "base64url");
  if (expected.length < 16) return false;
  try {
    const key = await derive(password, Buffer.from(saltText, "base64url"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** A hash that never matches, used to keep login timing the same for unknown emails. */
let dummyHash: Promise<string> | undefined;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword(randomBytes(12).toString("hex"));
  await verifyPassword(password, await dummyHash);
}

const PASSWORD_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Readable random password for new team members and resets (shown once). */
export function generatePassword(length = 16): string {
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  return out;
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_TEAM_PASSWORD_LENGTH) return `Use at least ${MIN_TEAM_PASSWORD_LENGTH} characters.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Use at most ${MAX_PASSWORD_LENGTH} characters.`;
  if (/^(.)\1+$/.test(password)) return "Choose a less predictable password.";
  return null;
}
