/**
 * Money helpers shared by server and client. Amounts are integers in minor
 * units (cents/pence) everywhere; only formatting and parsing touch decimals.
 */

export const CURRENCIES = [
  { value: "USD", label: "USD — US dollar" },
  { value: "GBP", label: "GBP — British pound" },
  { value: "AUD", label: "AUD — Australian dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CAD", label: "CAD — Canadian dollar" },
] as const;

export type Currency = (typeof CURRENCIES)[number]["value"];

export function isCurrency(value: string): value is Currency {
  return CURRENCIES.some((c) => c.value === value);
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(minor: number, currency: Currency | string, { compact = false } = {}): string {
  const key = `${currency}:${compact}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      ...(compact ? { notation: "compact", maximumFractionDigits: 1 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    formatters.set(key, formatter);
  }
  return formatter.format(minor / 100);
}

/** "1,299.50" → 129950. Returns null for anything that isn't a non-negative amount. */
export function parseMoney(input: unknown, { max = 100_000_000_00 } = {}): number | null {
  if (typeof input !== "string" && typeof input !== "number") return null;
  const text = String(input).trim().replace(/[,\s]/g, "").replace(/^[$£€]/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const minor = Math.round(Number(text) * 100);
  return Number.isSafeInteger(minor) && minor >= 0 && minor <= max ? minor : null;
}

/** 129950 → "1299.50" for form inputs. */
export function moneyToInput(minor: number): string {
  return (minor / 100).toFixed(2);
}

/** Sums `{currency, amount}` rows into one total per currency, largest first. */
export function totalsByCurrency(rows: { currency: string; amount: number }[]): { currency: Currency; amount: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.currency, (map.get(row.currency) ?? 0) + row.amount);
  return [...map.entries()].filter(([, amount]) => amount > 0).map(([currency, amount]) => ({ currency: currency as Currency, amount })).sort((a, b) => b.amount - a.amount);
}

export function formatTotals(totals: { currency: Currency; amount: number }[], fallbackCurrency: Currency = "USD"): string {
  if (totals.length === 0) return formatMoney(0, fallbackCurrency);
  return totals.map((t) => formatMoney(t.amount, t.currency)).join(" + ");
}
