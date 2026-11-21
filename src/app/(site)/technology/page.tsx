import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentCard } from "@/components/blog/article-card";
import { Icon } from "@/components/shared/icon";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { articleCover, getArticlesByCategory, getReadingTime } from "@/data/articles";
import { articleCategories } from "@/data/categories";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Technology Insights — AI, Machine Learning, SaaS & Cloud",
  description:
    "Clear explainers on artificial intelligence, machine learning, SaaS, software development, cloud technology and business technology for professionals and teams.",
  path: "/technology",
});

/** Editorial framing for each technology topic. */
const topicIntros: Record<string, string> = {
  "artificial-intelligence": "How modern AI systems work, where they fall short and how to use them responsibly at work.",
  "machine-learning": "The core ideas behind machine learning — data, training and evaluation — explained for decision-makers.",
  saas: "How software-as-a-service products are changing as AI features, new pricing models and data questions arrive.",
  "software-development": "AI-assisted engineering, developer tooling and the practices that keep code quality high.",
  "cloud-technology": "Managed AI services, infrastructure choices and the cost and lock-in trade-offs of the major clouds.",
  "business-technology": "Adopting technology strategically — from first pilots to policies that scale across a growing team.",
};

export default function TechnologyPage() {
  const topics = articleCategories.filter((c) => c.isTechnologyTopic);

  return (
    <>
      <PageHero
        eyebrow="Technology"
        title={
          <>
            Understand the <span className="text-gradient">technology</span> behind the tools
          </>
        }
        description="Explainers and analysis on AI, machine learning, SaaS, software development, cloud and business technology — written for professionals, not just engineers."
        breadcrumbs={[{ name: "Technology", href: "/technology" }]}
      >
        <nav aria-label="Technology topics" className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <a key={t.slug} href={`#${t.slug}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary">
              <Icon name={t.icon} className="h-4 w-4" />
              {t.name}
            </a>
          ))}
        </nav>
      </PageHero>

      <div className="container-site space-y-24 py-16">
        {topics.map((topic, index) => {
          const topicArticles = getArticlesByCategory(topic.slug);
          return (
            <section key={topic.slug} aria-labelledby={topic.slug} className="grid gap-8 lg:grid-cols-[20rem_1fr]">
              <Reveal>
                <div className="lg:sticky lg:top-28">
                  <span className="text-sm font-semibold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Icon name={topic.icon} className="h-5 w-5" />
                  </span>
                  <h2 id={topic.slug} className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                    {topic.name}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{topicIntros[topic.slug] ?? topic.description}</p>
                  <Link href={`/blog?category=${topic.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    All {topic.name} articles <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </Reveal>
              {topicArticles.length > 0 ? (
                <Stagger className="grid gap-6 md:grid-cols-2">
                  {topicArticles.map((a) => (
                    <StaggerItem key={a.slug}>
                      <ContentCard
                        item={{
                          href: `/blog/${a.slug}`,
                          title: a.title,
                          excerpt: a.excerpt,
                          cover: articleCover(a.slug),
                          categoryLabel: topic.name,
                          publishedAt: a.publishedAt,
                          readingTime: getReadingTime(a),
                        }}
                      />
                    </StaggerItem>
                  ))}
                </Stagger>
              ) : (
                <p className="rounded-[var(--radius-card)] border border-dashed border-border p-8 text-muted-foreground">
                  New {topic.name.toLowerCase()} articles are on the way.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
