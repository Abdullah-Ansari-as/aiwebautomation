import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-friendly reference such as `MSG-7KQ2ZD` (no 0/O/1/I to avoid confusion). */
export function newPrefixedReference(prefix: string): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const byte of bytes) code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  return `${prefix}-${code}`;
}

/** MongoDB ObjectIds rendered as 24 hex characters. */
export function isObjectIdString(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{24}$/i.test(value);
}

/** Parses a validated id; anything else becomes null, so client input never reaches a query unchecked. */
export function toObjectId(value: unknown): ObjectId | null {
  return isObjectIdString(value) ? new ObjectId(value) : null;
}

/** Random lowercase hex token (unsubscribe links, public invoice links). */
export function randomToken(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}
