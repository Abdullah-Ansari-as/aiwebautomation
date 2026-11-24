import type { ContentSection } from "@/types";

type ClassValue = string | false | null | undefined;

/** Joins class names, skipping falsy values. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Formats an ISO date (YYYY-MM-DD) deterministically in UTC so server and
 * client output always match.
 */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}

/** Strips the inline markdown subset used in content strings. */
export function stripInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Estimated reading time in minutes at 225 words per minute. */
export function readingTimeFromSections(intro: string, sections: ContentSection[]): number {
  let words = countWords(intro);
  for (const section of sections) {
    words += countWords(section.heading);
    for (const block of section.blocks) {
      if (block.type === "list") words += block.items.reduce((n, item) => n + countWords(item), 0);
      else if (block.type === "code") words += countWords(block.code) / 2;
      else words += countWords(block.text);
    }
  }
  return Math.max(1, Math.round(words / 225));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Case-insensitive match of every whitespace-separated term in `query`. */
export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** Formats a full ISO timestamp in UTC, e.g. "Nov 18, 2026, 14:05 UTC". */
export function formatDateTime(iso: string): string {
  return `${dateTimeFormatter.format(new Date(iso))} UTC`;
}

const dayFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

/** Formats a full ISO timestamp as a UTC calendar day, e.g. "Nov 18, 2026". */
export function formatDay(iso: string): string {
  return dayFormatter.format(new Date(iso));
}

/** ISO timestamp → "YYYY-MM-DD" for <input type="date">. */
export function toDateInput(iso: string | Date): string {
  return (typeof iso === "string" ? new Date(iso) : iso).toISOString().slice(0, 10);
}
