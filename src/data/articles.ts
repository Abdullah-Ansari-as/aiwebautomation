import type { Article } from "@/types";
import { articlesA } from "./content/articles-a";
import { articlesB } from "./content/articles-b";
import { readingTimeFromSections } from "@/lib/utils";

/** All blog articles, newest first. */
export const articles: Article[] = [...articlesA, ...articlesB].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);

export type ArticleSummary = Omit<Article, "sections" | "intro"> & {
  readingTime: number;
  cover: string;
};

export function articleCover(slug: string): string {
  return `/images/blog/${slug}.webp`;
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getReadingTime(article: Pick<Article, "intro" | "sections">): number {
  return readingTimeFromSections(article.intro, article.sections);
}

/** Lightweight version for listings and client components (no body). */
export function toArticleSummary(article: Article): ArticleSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sections, intro, ...rest } = article;
  return { ...rest, readingTime: getReadingTime(article), cover: articleCover(article.slug) };
}

export function getArticleSummaries(): ArticleSummary[] {
  return articles.map(toArticleSummary);
}

export function getFeaturedArticle(): Article {
  return articles.find((a) => a.featured) ?? articles[0];
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const scored = articles
    .filter((a) => a.slug !== article.slug)
    .map((a) => {
      const sharedTags = a.tags.filter((t) => article.tags.includes(t)).length;
      const sameCategory = a.category === article.category ? 2 : 0;
      return { a, score: sharedTags + sameCategory };
    })
    .sort((x, y) => y.score - x.score || y.a.publishedAt.localeCompare(x.a.publishedAt));
  return scored.slice(0, limit).map((s) => s.a);
}

/** Previous = older article, next = newer article. */
export function getAdjacentArticles(slug: string): { previous?: Article; next?: Article } {
  const index = articles.findIndex((a) => a.slug === slug);
  if (index === -1) return {};
  return { next: articles[index - 1], previous: articles[index + 1] };
}

export function getArticlesByCategory(category: Article["category"]): Article[] {
  return articles.filter((a) => a.category === category);
}

export function getArticlesMentioningTool(toolSlug: string): Article[] {
  return articles.filter((a) => a.relatedTools?.includes(toolSlug));
}
