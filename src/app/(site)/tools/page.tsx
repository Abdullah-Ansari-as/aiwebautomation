import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { ToolsDirectory } from "@/components/tools/tools-directory";
import { toolCategories } from "@/data/categories";
import { tools } from "@/data/tools";
import { itemListSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "AI Tools Directory — Compare the Best AI Tools",
  description:
    "Search and compare well-known AI tools for writing, images, video, coding, productivity, marketing and automation. Filter by category and pricing model.",
  path: "/tools",
});

export default function ToolsPage() {
  const sorted = [...tools].sort((a, b) => a.popularityRank - b.popularityRank);
  return (
    <>
      <JsonLd data={itemListSchema("AI Tools Directory", sorted.map((t) => ({ name: t.name, href: `/tools/${t.slug}` })))} />
      <PageHero
        eyebrow="AI tools directory"
        title={
          <>
            Find the right <span className="text-gradient">AI tool</span> for the job
          </>
        }
        description={`Browse ${tools.length} carefully described AI tools across ${toolCategories.length} categories. Filter by pricing model, sort by popularity or recency, and open any tool for features, pros, cons and alternatives.`}
        breadcrumbs={[{ name: "AI Tools", href: "/tools" }]}
      />
      <div className="container-site py-12">
        <ToolsDirectory tools={sorted} categories={toolCategories} />
      </div>
    </>
  );
}
