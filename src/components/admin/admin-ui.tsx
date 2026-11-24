"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:outline-none";

export function Field({ label, htmlFor, children, hint, error }: { label: string; htmlFor: string; children: ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; id: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", checked ? "bg-primary" : "bg-border-strong")}
      >
        <m.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className={cn("h-5 w-5 rounded-full bg-white shadow", checked ? "ml-[1.375rem]" : "ml-0.5")} />
      </button>
    </div>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[var(--radius-card)] border border-border bg-surface shadow-soft", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

