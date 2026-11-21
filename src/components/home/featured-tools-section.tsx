import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/shared/button";
import { SectionHeader } from "@/components/shared/section-header";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { ToolCard } from "@/components/tools/tool-card";
import type { AITool } from "@/types";

export function FeaturedToolsSection({ tools }: { tools: AITool[] }) {
  return (
    <section className="relative border-y border-border/60 bg-surface-muted/40 py-20 sm:py-24" aria-labelledby="featured-tools-heading">
      <div className="container-site">
        <SectionHeader
          eyebrow="Editor's picks"
          title={<span id="featured-tools-heading">Featured AI tools</span>}
          description="Widely used tools our editors recommend starting with, across writing, images, video, code and automation."
          action={
            <LinkButton href="/tools" variant="outline" size="sm">
              View all tools <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
          }
        />
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <StaggerItem key={tool.slug}>
              <ToolCard tool={tool} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
