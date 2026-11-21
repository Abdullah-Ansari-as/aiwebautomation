/**
 * Provider-agnostic conversion events. No analytics provider is bundled:
 * events are forwarded to GA4 (`gtag`), Google Tag Manager (`dataLayer`)
 * and/or Plausible when one of them has been added to the site, and are a
 * silent no-op otherwise.
 *
 * Events: services_page_view, consultation_click, inquiry_submit,
 * whatsapp_click, affiliate_click.
 */

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
