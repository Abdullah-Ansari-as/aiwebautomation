import type { Metadata } from "next";
import { AutomationInsightsSection } from "@/components/home/automation-insights-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedToolsSection } from "@/components/home/featured-tools-section";
import { Hero } from "@/components/home/hero";
import { LatestArticlesSection } from "@/components/home/latest-articles-section";
import { ServicesSection } from "@/components/home/services-section";
import { UtilitiesSection } from "@/components/home/utilities-section";
import { WhySection } from "@/components/home/why-section";
import { Newsletter } from "@/components/shared/newsletter";
import { articles, getArticleSummaries } from "@/data/articles";
import { workflowExamples } from "@/data/automation";
import { getArticleCategory, toolCategories } from "@/data/categories";
import { guides } from "@/data/guides";
import { pricingPackages, services } from "@/data/services";
import { siteConfig } from "@/data/site";
import { tools } from "@/data/tools";
import { utilities } from "@/data/utilities";
import { createMetadata } from "@/lib/seo";
import { countToolsInCategory, getFeaturedTools } from "@/lib/tools";
import { readingTimeFromSections } from "@/lib/utils";

export const metadata: Metadata = createMetadata({
  title: `${siteConfig.name} — Discover AI Tools, Automation & Technology Guides`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  const latest = getArticleSummaries().slice(0, 3);
  const automationGuides = guides
    .filter((g) => g.category === "automation-workflows" || g.slug === "how-to-self-host-n8n-with-docker")
    .slice(0, 4)
    .map((g) => ({
      title: g.title,
      href: `/guides/${g.slug}`,
      meta: `${g.difficulty} · ${readingTimeFromSections(g.intro, g.sections)} min read`,
    }));

  return (
    <>
      <Hero
        stats={[
          { label: "AI tools reviewed", value: tools.length },
          { label: "Categories", value: toolCategories.length },
          { label: "Free utilities", value: utilities.length },
          { label: "Guides & articles", value: guides.length + articles.length },
        ]}
      />
      <CategoriesSection categories={toolCategories.map((c) => ({ ...c, count: countToolsInCategory(c.slug) }))} />
      <FeaturedToolsSection tools={getFeaturedTools().slice(0, 8)} />
      <UtilitiesSection utilities={utilities.slice(0, 6)} />
      <WhySection />
      <ServicesSection services={services} fromPrice={Math.min(...pricingPackages.map((p) => p.fromPrice))} />
      <LatestArticlesSection
        items={latest.map((a) => ({
          href: `/blog/${a.slug}`,
          title: a.title,
          excerpt: a.excerpt,
          cover: a.cover,
          categoryLabel: getArticleCategory(a.category)?.name ?? "Article",
          publishedAt: a.publishedAt,
          readingTime: a.readingTime,
        }))}
      />
      <AutomationInsightsSection workflows={workflowExamples.slice(0, 3)} guides={automationGuides} />
      <Newsletter />
    </>
  );
}
