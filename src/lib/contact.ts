import { siteConfig } from "@/data/site";

/** wa.me click-to-chat link, or null when no WhatsApp number is configured. */
export function whatsappLink(message?: string): string | null {
  const number = siteConfig.whatsappNumber;
  if (!number || number.length < 8) return null;
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
