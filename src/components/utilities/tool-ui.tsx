"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check, Copy, Eraser, Info, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Reusable building blocks shared by every on-site utility. */

export function ToolPanel({
  title,
  actions,
  children,
  className,
  footer,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft", className)}>
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </header>
      <div className="flex-1">{children}</div>
      {footer && <footer className="border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">{footer}</footer>}
    </section>
  );
}

export function ToolTextarea({
  value,
  onChange,
  placeholder,
  label,
  rows = 12,
  mono,
  readOnly,
  id,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  label: string;
  rows?: number;
  mono?: boolean;
  readOnly?: boolean;
  id?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      rows={rows}
      readOnly={readOnly}
      spellCheck={!mono}
      className={cn(
        "block w-full resize-y bg-transparent px-4 py-4 text-[0.95rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none sm:px-5",
        mono && "font-mono text-[0.85rem]",
      )}
    />
  );
}

export function CopyButton({ text, label = "Copy", disabled }: { text: string; label?: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled || !text}
      className="relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground transition-all hover:border-primary/40 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
      aria-label={copied ? "Copied to clipboard" : label}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <m.span key="ok" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="inline-flex items-center gap-1.5 text-success">
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Copied
          </m.span>
        ) : (
          <m.span key="copy" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="inline-flex items-center gap-1.5">
            <Copy className="h-3.5 w-3.5" aria-hidden="true" /> {label}
          </m.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function ClearButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-40"
    >
      <Eraser className="h-3.5 w-3.5" aria-hidden="true" /> Clear
    </button>
  );
}

export function PrimaryAction({ children, onClick, disabled, type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <m.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgb(109_74_255/0.7)] transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50 dark:text-primary-foreground"
    >
      {children}
    </m.button>
  );
}

export function ExampleChips({ examples, onSelect }: { examples: { label: string; input: string }[]; onSelect: (input: string) => void }) {
  if (examples.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Try an example:
      </span>
      {examples.map((ex) => (
        <button
          key={ex.label}
          type="button"
          onClick={() => onSelect(ex.input)}
          className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
}

export function ModeNotice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "demo" }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
        tone === "demo" ? "border-warning/30 bg-warning/10 text-foreground" : "border-accent/20 bg-accent-soft/60 text-foreground",
      )}
    >
      <Info className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "demo" ? "text-warning" : "text-accent")} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/50 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
    </div>
  );
}

export function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-foreground">
      {children}
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:outline-none";

export const textareaClass =
  "w-full rounded-xl border border-border-strong bg-surface px-3.5 py-3 text-sm leading-relaxed text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:outline-none";

/** Animated output wrapper: fades in new results. */
export function OutputReveal({ id, children }: { id: string | number; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
        {children}
      </m.div>
    </AnimatePresence>
  );
}
