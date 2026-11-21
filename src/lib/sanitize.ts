/**
 * Input normalisation for untrusted form values. Output is plain text; it is
 * stored as-is and escaped wherever it is rendered (React, email HTML).
 */

// C0/C1 control characters except tab and newline, plus zero-width and
// bidirectional-override characters that can disguise text.
const CONTROL_MULTILINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const CONTROL_SINGLE_LINE = /[\u0000-\u001F\u007F-\u009F]/g;
const INVISIBLE = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

export function cleanText(value: unknown, { multiline = false }: { multiline?: boolean } = {}): string {
  if (typeof value !== "string") return "";
  let text = value.normalize("NFC").replace(/\r\n?/g, "\n");
  text = text.replace(multiline ? CONTROL_MULTILINE : CONTROL_SINGLE_LINE, multiline ? "" : " ").replace(INVISIBLE, "");
  text = multiline ? text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n") : text.replace(/\s+/g, " ");
  return text.trim();
}

const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/;

export function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

/** Accepts "example.com" or a full http(s) URL; returns a normalised https/http URL or null. */
export function normalizeWebsite(value: string): string | null {
  if (!value) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizePhone(value: string): string | null {
  const phone = value.trim();
  if (!/^\+?[0-9 ().-]{7,32}$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? phone : null;
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}
