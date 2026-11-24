"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { sendBeacon, track } from "@/lib/analytics";

/**
 * One delegated click listener that turns `data-track` attributes on any
 * link or button into analytics events, so server-rendered CTAs don't need
 * to become client components.
 */
export function AnalyticsListener() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!target) return;
      const props: Record<string, string> = {};
      for (const [key, value] of Object.entries(target.dataset)) {
        if (key !== "track" && key.startsWith("track") && value !== undefined) {
          props[key.charAt(5).toLowerCase() + key.slice(6)] = value;
        }
      }
      track(target.dataset.track!, props);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}

/** Fires a single event when mounted, e.g. a page-view for a key landing page. */
export function TrackOnMount({ event, props }: { event: string; props?: Record<string, string> }) {
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
  }, []);
  return null;
}

/**
 * Records a cookieless page view on every client-side navigation. Render it
 * inside <Suspense> (it reads the current pathname).
 */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const referrer = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";
    sendBeacon({ type: "pageview", path: pathname, referrer });
  }, [pathname]);
  return null;
}
