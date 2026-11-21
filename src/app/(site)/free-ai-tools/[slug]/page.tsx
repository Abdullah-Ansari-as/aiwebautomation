import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/shared/accordion";
import { Badge } from "@/components/shared/badge";
import { Icon } from "@/components/shared/icon";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { UtilityCard } from "@/components/utilities/utility-card";
import { UtilityRenderer } from "@/components/utilities/utility-renderer";
import { getRelatedUtilities, getUtility, utilities } from "@/data/utilities";
import { faqSchema, utilitySoftwareSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";

/**
 * Every slug is prerendered via generateStaticParams; allowing this segment to
 * block on `params` during client navigation keeps the full article/tool HTML
 * in the static output instead of a Suspense placeholder.
 */
export const instant = false;

export function generateStaticParams() {
  return utilities.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: PageProps<"/free-ai-tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const utility = getUtility(slug);
  if (!utility) return { title: "Tool not found" };
  return createMetadata({
    title: `Free ${utility.name} — Online & No Sign-Up`,
    description: utility.description.slice(0, 160),
    path: `/free-ai-tools/${utility.slug}`,
  });
}

export default async function UtilityPage({ params }: PageProps<"/free-ai-tools/[slug]">) {
  const { slug } = await params;
  const utility = getUtility(slug);
  if (!utility) notFound();
  const related = getRelatedUtilities(utility.related);

  return (
    <>
      <JsonLd data={[utilitySoftwareSchema(utility), faqSchema(utility.faqs)]} />
      <PageHero
        title={
          <span className="flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
              <Icon name={utility.icon} className="h-6 w-6" />
            </span>
            {utility.name}
          </span>
        }
        description={utility.description}
        breadcrumbs={[
          { name: "Free AI Tools", href: "/free-ai-tools" },
          { name: utility.name, href: `/free-ai-tools/${utility.slug}` },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone={utility.mode === "Runs in your browser" ? "success" : "warning"}>{utility.mode}</Badge>
          <Badge>Free · No sign-up</Badge>
          <Badge>{utility.group}</Badge>
        </div>
      </PageHero>

      <div className="container-site py-10">
        <UtilityRenderer slug={utility.slug} examples={utility.examples} />

        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <Reveal as="section">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">How to use the {utility.name}</h2>
            <ol className="mt-6 space-y-4">
              {utility.howToUse.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="pt-1 leading-relaxed text-muted-foreground">{step}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal as="section" delay={0.08}>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Frequently asked questions</h2>
            <Accordion items={utility.faqs} className="mt-6" />
          </Reveal>
        </div>

        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="related-utilities">
            <h2 id="related-utilities" className="text-2xl font-semibold tracking-tight text-foreground">
              Related utilities
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((u) => (
                <UtilityCard key={u.slug} utility={u} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
