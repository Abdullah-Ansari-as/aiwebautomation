"use client";

import { AnimatePresence, m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { useQueryParams } from "@/hooks/use-query-params";
import { cn, matchesQuery } from "@/lib/utils";
import { ContentCard, type ContentCardData } from "./article-card";

export interface ExplorerItem extends ContentCardData {
  categorySlug: string;
  searchText: string;
}

/**
 * Searchable, filterable list of articles or guides with a "load more"
 * interaction. Filters live in the URL (`?q=` and `?category=`).
 */
export function ContentExplorer({
  items,
  categories,
  pageSize = 6,
  searchLabel,
  noun,
}: {
  items: ExplorerItem[];
  categories: { slug: string; name: string }[];
  pageSize?: number;
  searchLabel: string;
  noun: string;
}) {
  const [params, setParams] = useQueryParams();
  const [visible, setVisible] = useState(pageSize);
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "";

  const filtered = useMemo(
    () =>
      items.filter(
        (item) => (!category || item.categorySlug === category) && matchesQuery(query, item.title, item.excerpt, item.categoryLabel, item.searchText),
      ),
    [items, category, query],
  );
  const shown = filtered.slice(0, visible);

  const update = (next: Record<string, string | null>) => {
    setVisible(pageSize);
    setParams(next);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Categories" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {[{ slug: "", name: "All" }, ...categories].map((c) => {
            const active = category === c.slug;
            return (
              <button
                key={c.slug || "all"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => update({ category: c.slug || null })}
                className={cn(
                  "relative whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active ? "border-transparent text-white dark:text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {active && <m.span layoutId={`${noun}-category-pill`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                <span className="relative">{c.name}</span>
              </button>
            );
          })}
        </div>
        <SearchInput value={query} onChange={(v) => update({ q: v || null })} placeholder={`Search ${noun}…`} label={searchLabel} className="lg:w-80" />
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? noun.replace(/s$/, "") : noun}
        {(query || category) && (
          <button type="button" onClick={() => update({ q: null, category: null })} className="ml-3 font-medium text-primary hover:underline">
            Clear filters
          </button>
        )}
      </p>

      <div className="mt-6">
        {shown.length ? (
          <m.ul layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((item, i) => (
                <m.li
                  key={item.href}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.max(0, i - (visible - pageSize)) * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.96 }}
                >
                  <ContentCard item={item} headingLevel="h3" />
                </m.li>
              ))}
            </AnimatePresence>
          </m.ul>
        ) : (
          <EmptyState
            title={`No ${noun} found`}
            description="Try a different keyword or browse all categories."
            action={
              <Button variant="outline" onClick={() => update({ q: null, category: null })}>
                Reset filters
              </Button>
            }
          />
        )}
      </div>

      {filtered.length > visible && (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + pageSize)}>
            Load more {noun} <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
