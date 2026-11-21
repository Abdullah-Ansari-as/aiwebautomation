import type { ReactNode } from "react";
import type { BreadcrumbEntry } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { AmbientBackground } from "./background";
import { Breadcrumbs } from "./breadcrumbs";

/**
 * Hero band for inner pages. Uses a CSS entrance animation (not JS) so the
 * heading is visible at first paint for good LCP.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbEntry[];
  children?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <section className={cn("relative isolate overflow-hidden border-b border-border/60", className)}>
      <AmbientBackground intensity="subtle" />
      <div className={cn("container-site pb-14 pt-10 sm:pb-16 sm:pt-12", centered && "text-center")}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className={cn("mb-8 animate-fade-up", centered && "flex justify-center")} />}
        <div className={cn("max-w-3xl", centered && "mx-auto")}>
          {eyebrow && (
            <p className="mb-4 inline-flex animate-fade-up items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="animate-fade-up text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl [animation-delay:60ms]">
            {title}
          </h1>
          {description && (
            <p className="mt-5 animate-fade-up text-lg leading-relaxed text-muted-foreground text-pretty [animation-delay:120ms]">
              {description}
            </p>
          )}
        </div>
        {children && <div className="mt-8 animate-fade-up [animation-delay:180ms]">{children}</div>}
      </div>
    </section>
  );
}
