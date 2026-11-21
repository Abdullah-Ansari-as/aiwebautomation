import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import { cn, formatDate } from "@/lib/utils";

export interface ContentCardData {
  href: string;
  title: string;
  excerpt: string;
  cover: string;
  categoryLabel: string;
  publishedAt: string;
  readingTime: number;
  meta?: string;
}

/** Card for blog articles and guides. `layout="feature"` renders a large horizontal card. */
export function ContentCard({
  item,
  layout = "default",
  priority,
  headingLevel = "h3",
  className,
}: {
  item: ContentCardData;
  layout?: "default" | "feature" | "compact";
  priority?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  const feature = layout === "feature";
  const compact = layout === "compact";

  return (
    <article
      className={cn(
        "group relative flex h-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft",
        "transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lift",
        feature ? "flex-col lg:grid lg:grid-cols-2" : compact ? "flex-row items-center gap-4 p-3" : "flex-col",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface-muted",
          feature ? "aspect-[1200/630] lg:aspect-auto lg:min-h-full" : compact ? "aspect-square w-24 shrink-0 rounded-xl" : "aspect-[1200/630]",
        )}
      >
        <Image
          src={item.cover}
          alt=""
          fill
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          sizes={feature ? "(min-width: 1024px) 640px, 100vw" : compact ? "96px" : "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className={cn("flex flex-1 flex-col", feature ? "p-7 lg:p-10" : compact ? "min-w-0 py-1 pr-2" : "p-6")}>
        {!compact && (
          <Badge tone="primary" className="self-start">
            {item.categoryLabel}
          </Badge>
        )}
        <Heading
          className={cn(
            "font-semibold tracking-tight text-foreground text-balance",
            feature ? "mt-4 text-2xl sm:text-3xl" : compact ? "line-clamp-2 text-sm" : "mt-4 text-lg leading-snug",
          )}
        >
          <Link href={item.href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {item.title}
          </Link>
        </Heading>
        {!compact && (
          <p className={cn("mt-3 text-muted-foreground", feature ? "text-base leading-relaxed" : "line-clamp-2 text-sm leading-relaxed")}>
            {item.excerpt}
          </p>
        )}
        <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", compact ? "mt-1.5" : "mt-auto pt-5")}>
          <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {item.readingTime} min read
          </span>
          {item.meta && (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.meta}</span>
            </>
          )}
        </div>
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-primary group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}
