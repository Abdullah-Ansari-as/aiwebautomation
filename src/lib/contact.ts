import { siteConfig } from "@/data/site";

/** wa.me click-to-chat link, or null when no WhatsApp number is configured. */
export function whatsappLink(message?: string): string | null {
  const number = siteConfig.whatsappNumber;
  if (!number || number.length < 8) return null;
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/**
 * Calendly / Cal.com link for booking a call (NEXT_PUBLIC_BOOKING_URL, read at
 * build time), or null when not configured.
 */
export function bookingLink(): string | null {
  const url = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();
  return url && /^https:\/\/[^\s]+$/i.test(url) ? url : null;
}
