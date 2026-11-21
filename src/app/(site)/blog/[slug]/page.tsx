import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/blog/article-layout";
import { ServiceCta } from "@/components/services/service-cta";
import { JsonLd } from "@/components/shared/json-ld";
import {
  articleCover,
  articles,
  getAdjacentArticles,
  getArticle,
  getReadingTime,
  getRelatedArticles,
} from "@/data/articles";
import { getArticleCategory } from "@/data/categories";
import { contentServiceMap, getService } from "@/data/services";
import { getAuthor } from "@/data/site";
import { articleSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";
import { getToolsBySlugs } from "@/lib/tools";

/**
 * Every slug is prerendered via generateStaticParams; allowing this segment to
 * block on `params` during client navigation keeps the full article/tool HTML
 * in the static output instead of a Suspense placeholder.
 */
export const instant = false;

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found" };
  return createMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/blog/${article.slug}`,
    type: "article",
    image: { url: articleCover(article.slug), alt: article.title },
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt ?? article.publishedAt,
    authors: [getAuthor(article.authorId).name],
    tags: article.tags,
  });
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const author = getAuthor(article.authorId);
  const service = getService(contentServiceMap[article.slug] ?? "");
  const category = getArticleCategory(article.category);
  const { previous, next } = getAdjacentArticles(article.slug);
  const path = `/blog/${article.slug}`;
  const cover = articleCover(article.slug);

  return (
    <>
      <JsonLd data={articleSchema(article, author, path, cover)} />
      <ArticleLayout
        path={path}
        title={article.title}
        excerpt={article.excerpt}
        categoryLabel={category?.name ?? "Article"}
        categoryHref={`/blog?category=${article.category}`}
        cover={cover}
        author={author}
        publishedAt={article.publishedAt}
        updatedAt={article.updatedAt}
        readingTime={getReadingTime(article)}
        intro={article.intro}
        sections={article.sections}
        tags={article.tags}
        breadcrumbs={[
          { name: "Blog", href: "/blog" },
          { name: article.title, href: path },
        ]}
        tools={getToolsBySlugs(article.relatedTools ?? [])}
        afterContent={
          service && (
            <ServiceCta
              variant="inline"
              title="Want this automated for your business?"
              description={`We design and build automations like these for teams that would rather not do it themselves — see our ${service.title.toLowerCase()} service.`}
              serviceId={service.id}
              ctaLabel="Get a quote"
              location={`article:${article.slug}`}
            />
          )
        }
        previous={previous && { href: `/blog/${previous.slug}`, title: previous.title }}
        next={next && { href: `/blog/${next.slug}`, title: next.title }}
        relatedTitle="Related articles"
        related={getRelatedArticles(article).map((a) => ({
          href: `/blog/${a.slug}`,
          title: a.title,
          excerpt: a.excerpt,
          cover: articleCover(a.slug),
          categoryLabel: getArticleCategory(a.category)?.name ?? "Article",
          publishedAt: a.publishedAt,
          readingTime: getReadingTime(a),
        }))}
      />
    </>
  );
}
