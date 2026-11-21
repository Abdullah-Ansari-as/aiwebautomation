import { ArrowRight } from "lucide-react";
import { ContentCard, type ContentCardData } from "@/components/blog/article-card";
import { LinkButton } from "@/components/shared/button";
import { SectionHeader } from "@/components/shared/section-header";
import { Stagger, StaggerItem } from "@/components/shared/reveal";

export function LatestArticlesSection({ items }: { items: ContentCardData[] }) {
  return (
    <section className="container-site py-20 sm:py-24" aria-labelledby="latest-articles-heading">
      <SectionHeader
        eyebrow="From the blog"
        title={<span id="latest-articles-heading">Latest articles</span>}
        description="Comparisons, explainers and analysis on AI tools, automation and the technology behind them."
        action={
          <LinkButton href="/blog" variant="outline" size="sm">
            Read the blog <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        }
      />
      <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <StaggerItem key={item.href}>
            <ContentCard item={item} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
