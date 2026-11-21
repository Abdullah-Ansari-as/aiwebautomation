"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Copyright year range. The prerendered HTML uses the founding year; the
 * browser swaps in the current year after hydration, so a static build never
 * freezes an outdated year.
 */
export function CopyrightYears({ from }: { from: number }) {
  const year = useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => from,
  );
  return <span>{year > from ? `${from}–${year}` : from}</span>;
}
