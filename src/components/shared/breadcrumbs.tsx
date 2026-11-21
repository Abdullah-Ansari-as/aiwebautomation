import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbSchema, type BreadcrumbEntry } from "@/lib/schema";
import { JsonLd } from "./json-ld";
import { cn } from "@/lib/utils";

/**
 * Visible breadcrumb trail plus matching BreadcrumbList JSON-LD. The last
 * entry is the current page.
 */
export function Breadcrumbs({ items, className }: { items: BreadcrumbEntry[]; className?: string }) {
  const trail: BreadcrumbEntry[] = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
        <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />}
                {isLast ? (
                  <span aria-current="page" className="font-medium text-foreground line-clamp-1">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    {index === 0 && <Home className="h-3.5 w-3.5" aria-hidden="true" />}
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
