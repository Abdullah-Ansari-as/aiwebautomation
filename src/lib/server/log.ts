import "server-only";

/**
 * Logs a server error without leaking secrets: connection-string
 * credentials and API-key-like tokens are redacted, and only the error's
 * name and message are printed (no request bodies or personal data).
 */
export function logServerError(context: string, error: unknown): void {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`${context}: ${redactSecrets(raw)}`);
}

export function redactSecrets(text: string): string {
  return text
    .replace(/(mongodb(?:\+srv)?:\/\/)[^@/\s]+@/gi, "$1***@")
    .replace(/\bre_[A-Za-z0-9_]{8,}\b/g, "re_***")
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1***");
}
