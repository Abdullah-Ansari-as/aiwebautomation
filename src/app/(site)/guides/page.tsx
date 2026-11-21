import { ArrowRight, BarChart3, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentExplorer } from "@/components/blog/content-explorer";
import { Badge } from "@/components/shared/badge";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { getGuideCategory, guideCategories } from "@/data/categories";
import { getGuideSummaries, guides } from "@/data/guides";
import { itemListSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "How-To Guides — Step-by-Step AI & Automation Tutorials",
  description:
    "Practical, step-by-step tutorials for AI prompts, automation workflows with Zapier, Make and n8n, developer tools and content creation.",
  path: "/guides",
});

export default function GuidesPage() {
  const summaries = getGuideSummaries();
  const featured = summaries.filter((g) => g.featured).concat(summaries.filter((g) => !g.featured)).slice(0, 3);

  return (
    <>
      <JsonLd data={itemListSchema("How-To Guides", guides.map((g) => ({ name: g.title, href: `/guides/${g.slug}` })))} />
      <PageHero
        eyebrow="How-to guides"
        title={
          <>
            Learn by doing with <span className="text-gradient">step-by-step guides</span>
          </>
        }
        description="Hands-on tutorials that walk you through real setups — from writing better prompts to self-hosting your own automation server."
        breadcrumbs={[{ name: "How-To Guides", href: "/guides" }]}
      />
      <div className="container-site py-12">
        <section aria-labelledby="featured-guides">
          <h2 id="featured-guides" className="text-2xl font-semibold tracking-tight text-foreground">
            Featured guides
          </h2>
          <Stagger className="mt-6 grid gap-6 lg:grid-cols-3">
            {featured.map((g, i) => (
              <StaggerItem key={g.slug} className={i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group relative flex h-full min-h-64 flex-col justify-end overflow-hidden rounded-[var(--radius-card)] border border-border p-6 text-white shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8"
                >
                  <Image
                    src={g.cover}
                    alt=""
                    fill
                    loading={i === 0 ? "eager" : undefined}
                    fetchPriority={i === 0 ? "high" : undefined}
                    sizes={i === 0 ? "(min-width: 1024px) 800px, 100vw" : "(min-width: 1024px) 400px, 100vw"}
                    className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#060918] via-[#060918]/75 to-[#060918]/10" />
                  <Badge tone="primary" className="self-start border-white/20 bg-white/15 text-white backdrop-blur">
                    {getGuideCategory(g.category)?.name}
                  </Badge>
                  <h3 className={i === 0 ? "mt-4 text-2xl font-semibold tracking-tight sm:text-3xl" : "mt-4 text-lg font-semibold leading-snug"}>{g.title}</h3>
                  {i === 0 && <p className="mt-3 max-w-xl text-slate-300">{g.excerpt}</p>}
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> {g.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {g.readingTime} min
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="mt-20" aria-labelledby="all-guides">
          <h2 id="all-guides" className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
            Latest guides
          </h2>
          <ContentExplorer
            noun="guides"
            searchLabel="Search guides"
            categories={guideCategories.filter((c) => guides.some((g) => g.category === c.slug)).map((c) => ({ slug: c.slug, name: c.name }))}
            items={summaries.map((g) => ({
              href: `/guides/${g.slug}`,
              title: g.title,
              excerpt: g.excerpt,
              cover: g.cover,
              categoryLabel: getGuideCategory(g.category)?.name ?? "Guide",
              categorySlug: g.category,
              publishedAt: g.publishedAt,
              readingTime: g.readingTime,
              meta: g.difficulty,
              searchText: g.tags.join(" "),
            }))}
          />
        </section>
      </div>
    </>
  );
}
