import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import type { Utility } from "@/types";

export function UtilityCard({ utility, className }: { utility: Utility; className?: string }) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft",
        "transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Icon name={utility.icon} className="h-5 w-5" />
        </span>
        <Badge tone={utility.mode === "Runs in your browser" ? "success" : "neutral"}>{utility.mode}</Badge>
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
        <Link href={`/free-ai-tools/${utility.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {utility.name}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{utility.shortDescription}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        Open tool
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-primary group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}
