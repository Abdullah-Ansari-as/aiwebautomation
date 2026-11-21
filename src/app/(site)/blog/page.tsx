import type { Metadata } from "next";
import { ContentCard } from "@/components/blog/article-card";
import { ContentExplorer } from "@/components/blog/content-explorer";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { articleCover, articles, getFeaturedArticle, getReadingTime, toArticleSummary } from "@/data/articles";
import { articleCategories, getArticleCategory } from "@/data/categories";
import { itemListSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Blog — AI Tools, Automation & Technology Articles",
  description:
    "In-depth articles on AI tools, workflow automation, productivity, machine learning, SaaS, cloud and business technology from the WebAIAutomation editorial team.",
  path: "/blog",
});

export default function BlogPage() {
  const featured = getFeaturedArticle();
  const rest = articles.filter((a) => a.slug !== featured.slug).map(toArticleSummary);
  const usedCategories = articleCategories.filter((c) => articles.some((a) => a.category === c.slug));

  return (
    <>
      <JsonLd data={itemListSchema("WebAIAutomation Blog", articles.map((a) => ({ name: a.title, href: `/blog/${a.slug}` })))} />
      <PageHero
        eyebrow="The WebAIAutomation blog"
        title={
          <>
            Insights on <span className="text-gradient">AI, automation</span> and technology
          </>
        }
        description="Clear explanations, fair comparisons and practical advice — written to help you make better decisions about the tools you use."
        breadcrumbs={[{ name: "Blog", href: "/blog" }]}
      />
      <div className="container-site py-12">
        <section aria-labelledby="featured-article">
          <h2 id="featured-article" className="sr-only">
            Featured article
          </h2>
          <ContentCard
            layout="feature"
            priority
            headingLevel="h2"
            item={{
              href: `/blog/${featured.slug}`,
              title: featured.title,
              excerpt: featured.excerpt,
              cover: articleCover(featured.slug),
              categoryLabel: `Featured · ${getArticleCategory(featured.category)?.name ?? "Article"}`,
              publishedAt: featured.publishedAt,
              readingTime: getReadingTime(featured),
            }}
          />
        </section>

        <section className="mt-16" aria-labelledby="latest-articles">
          <h2 id="latest-articles" className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
            Latest articles
          </h2>
          <ContentExplorer
            noun="articles"
            searchLabel="Search articles"
            categories={usedCategories.map((c) => ({ slug: c.slug, name: c.name }))}
            items={rest.map((a) => ({
              href: `/blog/${a.slug}`,
              title: a.title,
              excerpt: a.excerpt,
              cover: a.cover,
              categoryLabel: getArticleCategory(a.category)?.name ?? "Article",
              categorySlug: a.category,
              publishedAt: a.publishedAt,
              readingTime: a.readingTime,
              searchText: a.tags.join(" "),
            }))}
          />
        </section>
      </div>
    </>
  );
}
