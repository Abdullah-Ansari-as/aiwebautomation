import { BarChart3, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/blog/article-layout";
import { ServiceCta } from "@/components/services/service-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { getGuideCategory } from "@/data/categories";
import { getAdjacentGuides, getGuide, getRelatedGuides, guideCover, guides, toGuideSummary } from "@/data/guides";
import { contentServiceMap, getService } from "@/data/services";
import { getAuthor } from "@/data/site";
import { articleSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";
import { getToolsBySlugs } from "@/lib/tools";
import { readingTimeFromSections } from "@/lib/utils";

/**
 * Every slug is prerendered via generateStaticParams; allowing this segment to
 * block on `params` during client navigation keeps the full article/tool HTML
 * in the static output instead of a Suspense placeholder.
 */
export const instant = false;

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return createMetadata({
    title: guide.title,
    description: guide.excerpt,
    path: `/guides/${guide.slug}`,
    type: "article",
    image: { url: guideCover(guide.slug), alt: guide.title },
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt ?? guide.publishedAt,
    authors: [getAuthor(guide.authorId).name],
    tags: guide.tags,
  });
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const author = getAuthor(guide.authorId);
  const category = getGuideCategory(guide.category);
  const { previous, next } = getAdjacentGuides(guide.slug);
  const path = `/guides/${guide.slug}`;
  const cover = guideCover(guide.slug);
  const service = getService(contentServiceMap[guide.slug] ?? "");

  return (
    <>
      <JsonLd data={articleSchema(guide, author, path, cover)} />
      <ArticleLayout
        path={path}
        title={guide.title}
        excerpt={guide.excerpt}
        categoryLabel={category?.name ?? "Guide"}
        categoryHref={`/guides?category=${guide.category}`}
        cover={cover}
        author={author}
        publishedAt={guide.publishedAt}
        updatedAt={guide.updatedAt}
        readingTime={readingTimeFromSections(guide.intro, guide.sections)}
        intro={guide.intro}
        sections={guide.sections}
        tags={guide.tags}
        breadcrumbs={[
          { name: "How-To Guides", href: "/guides" },
          { name: guide.title, href: path },
        ]}
        tools={getToolsBySlugs(guide.relatedTools ?? [])}
        afterContent={
          service && (
            <ServiceCta
              variant="inline"
              title="Get This Automation Built For Your Business"
              description={`Short on time? We can build and test this workflow in your own accounts — part of our ${service.title.toLowerCase()} service.`}
              serviceId={service.id}
              ctaLabel="Get a quote"
              location={`guide:${guide.slug}`}
            />
          )
        }
        previous={previous && { href: `/guides/${previous.slug}`, title: previous.title }}
        next={next && { href: `/guides/${next.slug}`, title: next.title }}
        relatedTitle="More guides"
        related={getRelatedGuides(guide).map((g) => {
          const s = toGuideSummary(g);
          return {
            href: `/guides/${g.slug}`,
            title: g.title,
            excerpt: g.excerpt,
            cover: s.cover,
            categoryLabel: getGuideCategory(g.category)?.name ?? "Guide",
            publishedAt: g.publishedAt,
            readingTime: s.readingTime,
            meta: g.difficulty,
          };
        })}
        beforeContent={
          <div className="mb-10 grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground sm:flex-col sm:items-start sm:border-r sm:border-border sm:pr-6">
              <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>
                <span className="block text-xs font-normal text-muted-foreground">Difficulty</span>
                {guide.difficulty}
              </span>
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" /> Before you start
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-primary">
                {guide.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        }
      />
    </>
  );
}
