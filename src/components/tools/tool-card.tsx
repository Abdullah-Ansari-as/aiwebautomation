import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PricingBadge } from "@/components/shared/badge";
import { getToolCategory } from "@/data/categories";
import { cn } from "@/lib/utils";
import type { AITool } from "@/types";
import { ToolLogo } from "./tool-logo";

/** Tool card used across the homepage, directory and detail pages. The whole card is clickable. */
export function ToolCard({ tool, className, headingLevel = "h3" }: { tool: AITool; className?: string; headingLevel?: "h2" | "h3" }) {
  const category = getToolCategory(tool.category);
  const Heading = headingLevel;
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:shadow-lift",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at 0% 0%, ${tool.brandColors[0]}14, transparent 60%)`,
        }}
      />
      <div className="relative flex items-start gap-4">
        <ToolLogo tool={tool} className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Heading className="truncate text-lg font-semibold tracking-tight text-foreground">
              <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
                {tool.name}
              </Link>
            </Heading>
            <PricingBadge pricing={tool.pricing} className="shrink-0" />
          </div>
          <p className="truncate text-sm text-muted-foreground">by {tool.developer}</p>
        </div>
      </div>
      <p className="relative mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="truncate text-xs font-medium text-muted-foreground">{category?.name}</span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          View details
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
      {/* Focus ring for the stretched link */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-primary ring-offset-2 ring-offset-background group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}
