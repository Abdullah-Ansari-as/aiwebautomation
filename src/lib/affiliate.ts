import type { AITool } from "@/types";

export const DEFAULT_AFFILIATE_DISCLOSURE =
  "Affiliate link: we may earn a commission if you sign up through this link, at no extra cost to you. It never affects how we list or review tools.";

export interface AffiliateLink {
  href: string;
  label: string;
  disclosure: string;
}

/**
 * The affiliate link to show for a tool, or null. Returns a link only for an
 * "active" program with a valid https URL, so an incomplete or pending entry
 * can never produce a broken or undisclosed affiliate button.
 */
export function getAffiliateLink(tool: AITool): AffiliateLink | null {
  const affiliate = tool.affiliate;
  if (!affiliate || affiliate.status !== "active") return null;

  let url: URL;
  try {
    url = new URL(affiliate.url);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  for (const [key, value] of Object.entries(affiliate.trackingParams ?? {})) url.searchParams.set(key, value);

  return {
    href: url.toString(),
    label: affiliate.ctaLabel?.trim() || `Try ${tool.name}`,
    disclosure: affiliate.disclosure?.trim() || DEFAULT_AFFILIATE_DISCLOSURE,
  };
}
