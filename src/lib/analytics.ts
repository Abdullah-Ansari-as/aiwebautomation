/**
 * Conversion events. Every event in FIRST_PARTY_EVENTS is counted by the
 * built-in, cookieless analytics (POST /api/track → admin Analytics page).
 * Events are also forwarded to GA4 (`gtag`), Google Tag Manager
 * (`dataLayer`) and/or Plausible if one of them is added to the site later.
 */

export const FIRST_PARTY_EVENTS = ["services_page_view", "consultation_click", "inquiry_submit", "whatsapp_click", "affiliate_click", "newsletter_signup", "booking_click"] as const;

/** Sends a small JSON beacon to the first-party analytics endpoint. Never throws. */
export function sendBeacon(payload: Record<string, string>): void {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  } catch {
    // Analytics must never break the page.
  }
}

export type TrackProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export function track(event: string, props: TrackProps = {}): void {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean>;
  if ((FIRST_PARTY_EVENTS as readonly string[]).includes(event)) sendBeacon({ type: "event", name: event });
  try {
    if (typeof window.gtag === "function") window.gtag("event", event, clean);
    else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...clean });
    if (typeof window.plausible === "function") window.plausible(event, { props: clean });
  } catch {
    // Analytics must never break the page.
  }
}

/**
 * Attributes for server-rendered links: `data-track` names the event and
 * `data-track-*` attributes become its properties. Picked up by
 * <AnalyticsListener />.
 */
export function trackAttrs(event: string, props: Record<string, string> = {}): Record<string, string> {
  const attrs: Record<string, string> = { "data-track": event };
  for (const [key, value] of Object.entries(props)) attrs[`data-track-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = value;
  return attrs;
}
