"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowDownWideNarrow, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/shared/button";
import { useQueryParams } from "@/hooks/use-query-params";
import { cn, matchesQuery } from "@/lib/utils";
import type { AITool, PricingModel, ToolCategory } from "@/types";
import { ToolCard } from "./tool-card";

const PRICING: PricingModel[] = ["Free", "Freemium", "Paid"];
const VIEWS = [
  { id: "all", label: "All tools" },
  { id: "featured", label: "Featured" },
  { id: "popular", label: "Popular" },
  { id: "new", label: "New" },
] as const;
const SORTS = [
  { id: "popular", label: "Most popular" },
  { id: "newest", label: "Newest" },
  { id: "name", label: "Name (A–Z)" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];
type SortId = (typeof SORTS)[number]["id"];

/** Number of most-recently-added tools shown under the "New" view. */
const NEW_COUNT = 8;

export function ToolsDirectory({ tools, categories }: { tools: AITool[]; categories: ToolCategory[] }) {
  const [params, setParams] = useQueryParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const pricingParam = params.get("pricing") ?? "";
  const pricing = useMemo(
    () => pricingParam.split(",").filter((p): p is PricingModel => PRICING.includes(p as PricingModel)),
    [pricingParam],
  );
  const view = (VIEWS.some((v) => v.id === params.get("view")) ? params.get("view") : "all") as ViewId;
  const sort = (SORTS.some((s) => s.id === params.get("sort")) ? params.get("sort") : "popular") as SortId;

  const newestSlugs = useMemo(
    () => new Set([...tools].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, NEW_COUNT).map((t) => t.slug)),
    [tools],
  );

  const results = useMemo(() => {
    const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "";
    const filtered = tools.filter((tool) => {
      if (view === "featured" && !tool.featured) return false;
      if (view === "popular" && !tool.popular) return false;
      if (view === "new" && !newestSlugs.has(tool.slug)) return false;
      if (category && tool.category !== category && !tool.secondaryCategories?.includes(category as AITool["category"])) return false;
      if (pricing.length > 0 && !pricing.includes(tool.pricing)) return false;
      return matchesQuery(
        query,
        tool.name,
        tool.developer,
        tool.tagline,
        tool.description,
        categoryName(tool.category),
        tool.useCases.join(" "),
        tool.pricing,
      );
    });
    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "newest") return b.addedAt.localeCompare(a.addedAt);
      return a.popularityRank - b.popularityRank;
    });
  }, [tools, categories, view, category, pricing, query, sort, newestSlugs]);

  const activeFilterCount = (category ? 1 : 0) + pricing.length;
  const hasAnyFilter = Boolean(query || category || pricing.length || view !== "all");

  const togglePricing = (value: PricingModel) => {
    const next = pricing.includes(value) ? pricing.filter((p) => p !== value) : [...pricing, value];
    setParams({ pricing: next.join(",") || null });
  };

  const clearAll = () => setParams({ q: null, category: null, pricing: null, view: null });

  const countFor = (slug: string) =>
    tools.filter((t) => t.category === slug || t.secondaryCategories?.includes(slug as AITool["category"])).length;

  const filters = (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Category</legend>
        <ul className="space-y-1">
          <li>
            <FilterButton active={!category} onClick={() => setParams({ category: null })} label="All categories" count={tools.length} />
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <FilterButton
                active={category === c.slug}
                onClick={() => setParams({ category: category === c.slug ? null : c.slug })}
                label={c.name}
                count={countFor(c.slug)}
                icon={<Icon name={c.icon} className="h-4 w-4" />}
              />
            </li>
          ))}
        </ul>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pricing</legend>
        <div className="space-y-2">
          {PRICING.map((p) => (
            <label key={p} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={pricing.includes(p)}
                onChange={() => togglePricing(p)}
                className="h-4 w-4 rounded border-border-strong accent-[var(--primary)]"
              />
              <span className="flex-1">{p}</span>
              <span className="text-xs text-muted-foreground">{tools.filter((t) => t.pricing === p).length}</span>
            </label>
          ))}
        </div>
        <p className="mt-3 px-3 text-xs leading-relaxed text-muted-foreground">
          Pricing models change often — always confirm on the vendor&apos;s site.
        </p>
      </fieldset>
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-24">{filters}</div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={query}
            onChange={(v) => setParams({ q: v || null })}
            placeholder="Search by name, use case or company…"
            label="Search AI tools"
            className="flex-1"
          />
          <div className="flex gap-3">
            <label className="relative flex-1 sm:flex-none">
              <span className="sr-only">Sort tools</span>
              <ArrowDownWideNarrow className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <select
                value={sort}
                onChange={(e) => setParams({ sort: e.target.value === "popular" ? null : e.target.value })}
                className="h-12 w-full appearance-none rounded-xl border border-border-strong bg-surface pl-10 pr-8 text-sm text-foreground shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 sm:w-48"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-controls="mobile-filters"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-foreground shadow-soft lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.7rem] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <m.div
              id="mobile-filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden lg:hidden"
            >
              <div className="mt-4 rounded-2xl border border-border bg-surface p-5">{filters}</div>
            </m.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div role="tablist" aria-label="Tool views" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="tab"
                type="button"
                aria-selected={view === v.id}
                onClick={() => setParams({ view: v.id === "all" ? null : v.id })}
                className={cn(
                  "relative whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                  view === v.id ? "text-white dark:text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {view === v.id && (
                  <m.span layoutId="tools-view-pill" className="absolute inset-0 -z-0 rounded-lg bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                )}
                <span className="relative">{v.label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing <strong className="font-semibold text-foreground">{results.length}</strong> of {tools.length} tools
            {hasAnyFilter && (
              <button type="button" onClick={clearAll} className="ml-3 font-medium text-primary hover:underline">
                Clear all
              </button>
            )}
          </p>
        </div>

        <div className="mt-6">
          {results.length > 0 ? (
            <m.ul layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {results.map((tool) => (
                  <m.li
                    key={tool.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ToolCard tool={tool} headingLevel="h2" />
                  </m.li>
                ))}
              </AnimatePresence>
            </m.ul>
          ) : (
            <EmptyState
              title="No tools match your filters"
              description={query ? `We couldn't find tools matching “${query}”. Try a broader term or remove some filters.` : "Try removing a filter or choosing another category."}
              action={
                <Button variant="outline" onClick={clearAll}>
                  Clear all filters
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-primary-soft font-medium text-primary" : "text-foreground hover:bg-surface-muted",
      )}
    >
      {icon && <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>}
      <span className="flex-1">{label}</span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}
