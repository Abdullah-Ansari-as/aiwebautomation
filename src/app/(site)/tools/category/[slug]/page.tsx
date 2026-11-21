import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "@/components/blog/article-card";
import { Icon } from "@/components/shared/icon";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { SectionHeader } from "@/components/shared/section-header";
import { ToolCard } from "@/components/tools/tool-card";
import { articles, toArticleSummary } from "@/data/articles";
import { getArticleCategory, getToolCategory, toolCategories } from "@/data/categories";
import { itemListSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";
import { getToolsInCategory } from "@/lib/tools";

/**
 * Every slug is prerendered via generateStaticParams; allowing this segment to
 * block on `params` during client navigation keeps the full article/tool HTML
 * in the static output instead of a Suspense placeholder.
 */
export const instant = false;

export function generateStaticParams() {
  return toolCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getToolCategory(slug);
  if (!category) return { title: "Category not found" };
  return createMetadata({
    title: `Best ${category.name} Tools`,
    description: `${category.description} Compare ${getToolsInCategory(category.slug).length} ${category.name.toLowerCase()} tools by features, pricing model, pros and cons.`,
    path: `/tools/category/${category.slug}`,
  });
}

export default async function ToolCategoryPage({ params }: PageProps<"/tools/category/[slug]">) {
  const { slug } = await params;
  const category = getToolCategory(slug);
  if (!category) notFound();

  const categoryTools = getToolsInCategory(category.slug);
  const toolSlugs = new Set(categoryTools.map((t) => t.slug));
  const relatedArticles = articles
    .filter((a) => a.relatedTools?.some((t) => toolSlugs.has(t)))
    .slice(0, 3)
    .map(toArticleSummary);

  return (
    <>
      <JsonLd data={itemListSchema(`${category.name} tools`, categoryTools.map((t) => ({ name: t.name, href: `/tools/${t.slug}` })))} />
      <PageHero
        eyebrow={`${categoryTools.length} tools`}
        title={<>{category.name} tools</>}
        description={category.description}
        breadcrumbs={[
          { name: "AI Tools", href: "/tools" },
          { name: category.name, href: `/tools/category/${category.slug}` },
        ]}
      />
      <div className="container-site py-14">
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categoryTools.map((tool) => (
            <StaggerItem key={tool.slug}>
              <ToolCard tool={tool} headingLevel="h2" />
            </StaggerItem>
          ))}
        </Stagger>

        <section className="mt-20" aria-labelledby="other-categories">
          <h2 id="other-categories" className="text-xl font-semibold tracking-tight text-foreground">
            Explore other categories
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {toolCategories
              .filter((c) => c.slug !== category.slug)
              .map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/tools/category/${c.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                  >
                    <Icon name={c.icon} className="h-4 w-4" />
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        {relatedArticles.length > 0 && (
          <section className="mt-20">
            <SectionHeader
              title="Related reading"
              action={
                <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  All articles <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((a) => (
                <ContentCard
                  key={a.slug}
                  item={{
                    href: `/blog/${a.slug}`,
                    title: a.title,
                    excerpt: a.excerpt,
                    cover: a.cover,
                    categoryLabel: getArticleCategory(a.category)?.name ?? "Article",
                    publishedAt: a.publishedAt,
                    readingTime: a.readingTime,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
