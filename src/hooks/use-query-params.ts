"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "querystatechange";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(EVENT, callback);
  };
}

/**
 * Reads and writes URL query parameters without a server round-trip.
 *
 * The server snapshot is empty, so prerendered HTML always contains the
 * unfiltered listing (good for SEO, no Suspense boundary needed). On the
 * client the real query string is applied right after hydration, and updates
 * use `history.replaceState`, which Next.js keeps in sync with its router.
 */
export function useQueryParams() {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const setParams = useCallback((updates: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [params, setParams] as const;
}
