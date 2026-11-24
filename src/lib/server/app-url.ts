import "server-only";
import { siteConfig } from "@/data/site";

/**
 * Base URL for links in emails and copyable admin links (invoice links,
 * "open in admin"). APP_URL overrides the canonical domain, e.g.
 * http://localhost:3000 while testing locally.
 */
export function getAppUrl(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");
  return configured && /^https?:\/\/[^\s/]+$/i.test(configured) ? configured : siteConfig.url;
}
