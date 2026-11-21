import { Lock, MonitorSmartphone, Zap } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { UtilityCard } from "@/components/utilities/utility-card";
import { utilities } from "@/data/utilities";
import { itemListSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";
import type { Utility } from "@/types";

export const metadata: Metadata = createMetadata({
  title: "Free AI Tools & Utilities — No Sign-Up",
  description:
    "Free online utilities: text summarizer, email writer, prompt generator, word and character counters, case converter, JSON formatter, Markdown previewer and more.",
  path: "/free-ai-tools",
});

const groups: Utility["group"][] = ["Writing", "Text", "Developer", "SEO"];

const groupDescriptions: Record<Utility["group"], string> = {
  Writing: "Draft, summarize and structure content faster.",
  Text: "Count, check and transform text instantly.",
  Developer: "Format and preview data and documents.",
  SEO: "Optimise pages for search results.",
};

export default function FreeToolsPage() {
  return (
    <>
      <JsonLd data={itemListSchema("Free AI utilities", utilities.map((u) => ({ name: u.name, href: `/free-ai-tools/${u.slug}` })))} />
      <PageHero
        eyebrow="Free utilities"
        title={
          <>
            Free <span className="text-gradient">AI &amp; text tools</span> you can use right now
          </>
        }
        description="Practical utilities for writers, marketers and developers. No account needed, and most tools process your text entirely in your browser."
        breadcrumbs={[{ name: "Free AI Tools", href: "/free-ai-tools" }]}
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-success" aria-hidden="true" /> Private by default
          </li>
          <li className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" aria-hidden="true" /> Instant results
          </li>
          <li className="flex items-center gap-2">
            <MonitorSmartphone className="h-4 w-4 text-accent" aria-hidden="true" /> Works on any device
          </li>
        </ul>
      </PageHero>
      <div className="container-site space-y-16 py-14">
        {groups.map((group) => {
          const items = utilities.filter((u) => u.group === group);
          if (!items.length) return null;
          return (
            <section key={group} aria-labelledby={`group-${group}`}>
              <div className="mb-6">
                <h2 id={`group-${group}`} className="text-2xl font-semibold tracking-tight text-foreground">
                  {group} tools
                </h2>
                <p className="mt-1 text-muted-foreground">{groupDescriptions[group]}</p>
              </div>
              <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((u) => (
                  <StaggerItem key={u.slug}>
                    <UtilityCard utility={u} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          );
        })}
      </div>
    </>
  );
}
