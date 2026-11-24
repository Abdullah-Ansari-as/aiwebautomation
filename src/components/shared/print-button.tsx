"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Download PDF / Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      <Printer className="h-4 w-4" aria-hidden="true" /> {label}
    </button>
  );
}
