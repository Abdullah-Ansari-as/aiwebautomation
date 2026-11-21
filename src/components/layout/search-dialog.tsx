"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, CornerDownLeft, FileText, Layers, LayoutGrid, Search, Sparkles, WandSparkles, BookOpen, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { SearchEntry, SearchKind } from "@/lib/search-index";
import { cn, matchesQuery } from "@/lib/utils";

const kindIcon: Record<SearchKind, typeof Search> = {
  Tool: Sparkles,
  Utility: WandSparkles,
  Article: FileText,
  Guide: BookOpen,
  Category: LayoutGrid,
  Page: Layers,
};

const suggestions = ["ChatGPT", "automation", "image", "coding", "JSON", "prompts"];

/**
 * Global search modal (⌘K / Ctrl+K). Filters a prebuilt index entirely on the
 * client and animates results as they change.
 */
export function SearchDialog({
  index,
  open,
  onOpenChange,
}: {
  index: SearchEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return index.filter((e) => e.kind === "Tool").slice(0, 6);
    return index.filter((e) => matchesQuery(query, e.title, e.description, e.keywords, e.kind)).slice(0, 10);
  }, [index, query]);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setActive(0);
  }, [onOpenChange]);

  // Global shortcut.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Lock scroll and focus the input while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
          <m.div
            className="absolute inset-0 bg-[#050816]/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
          />
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label="Search WebAIAutomation"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-lift"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search tools, guides, articles…"
                aria-label="Search"
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `search-result-${active}` : undefined}
                role="combobox"
                aria-expanded="true"
                className="h-14 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!query && (
              <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <ul id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              <AnimatePresence initial={false} mode="popLayout">
                {results.map((result, i) => {
                  const KindIcon = kindIcon[result.kind];
                  return (
                    <m.li
                      layout
                      key={result.href}
                      id={`search-result-${i}`}
                      role="option"
                      aria-selected={i === active}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.15) }}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(result.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          i === active ? "bg-primary-soft" : "hover:bg-surface-muted",
                        )}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-primary">
                          <KindIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{result.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{result.description}</span>
                        </span>
                        <span className="hidden text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground sm:block">
                          {result.kind}
                        </span>
                        {i === active && <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />}
                      </button>
                    </m.li>
                  );
                })}
              </AnimatePresence>
              {results.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No results for “{query}”. Try a tool name or topic.
                </li>
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" /> to open · ↑↓ to navigate
              </span>
              <span>Esc to close</span>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
