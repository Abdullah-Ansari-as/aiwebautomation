import "server-only";

/**
 * Cheap bot filters shared by every public form:
 *  - a hidden honeypot input real visitors never see or fill;
 *  - a render timestamp: submissions faster than a human could type, or with
 *    a missing/forged/very old timestamp, are treated as automated.
 * Bots get a believable success response so they don't adapt; nothing is stored.
 */

/** Name of the hidden honeypot input. */
export const HONEYPOT_FIELD = "hp_extra_info";
export const MIN_FILL_TIME_MS = 3_000;
export const MAX_FORM_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function looksAutomated(formData: FormData, minFillMs = MIN_FILL_TIME_MS): boolean {
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") return true;
  const raw = formData.get("startedAt");
  // Missing/empty must not count as "a long time ago" (Number("") is 0).
  const startedAt = typeof raw === "string" && /^\d{10,16}$/.test(raw) ? Number(raw) : NaN;
  const elapsed = Date.now() - startedAt;
  return !(elapsed >= minFillMs && elapsed <= MAX_FORM_AGE_MS);
}

/** Only same-site paths like `/blog/some-post` are stored as the source page. */
export function safeSourcePath(value: string): string | null {
  return /^\/[a-z0-9\-/]{0,199}$/i.test(value) ? value : null;
}
