import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import { SectionHeader } from "@/components/shared/section-header";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { LinkButton } from "@/components/shared/button";
import type { ToolCategory } from "@/types";

export function CategoriesSection({ categories }: { categories: (ToolCategory & { count: number })[] }) {
  return (
    <section className="container-site py-20 sm:py-24" aria-labelledby="categories-heading">
      <SectionHeader
        eyebrow="Browse by category"
        title={<span id="categories-heading">Popular categories</span>}
        description="Jump straight to the type of AI tool you need — from writing assistants to workflow automation."
        action={
          <LinkButton href="/tools" variant="outline" size="sm">
            All tools <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        }
      />
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <StaggerItem key={category.slug}>
            <Link
              href={`/tools/category/${category.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-lift"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(135deg, ${category.gradient[0]}1f, ${category.gradient[1]}14)`,
                  boxShadow: `inset 0 0 0 1px ${category.gradient[0]}55`,
                  borderRadius: "inherit",
                }}
              />
              <span className="relative flex items-center justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${category.gradient[0]}, ${category.gradient[1]})` }}
                >
                  <Icon name={category.icon} className="h-5 w-5" />
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </span>
              <span className="relative mt-5 font-semibold text-foreground">{category.name}</span>
              <span className="relative mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{category.description}</span>
              <span className="relative mt-4 text-xs font-medium text-muted-foreground">
                {category.count} {category.count === 1 ? "tool" : "tools"}
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
