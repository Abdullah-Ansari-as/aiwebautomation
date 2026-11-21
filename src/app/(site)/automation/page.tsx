import { ArrowRight, CircleCheck, Flag, Sparkles, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentCard } from "@/components/blog/article-card";
import { ServiceCta } from "@/components/services/service-cta";
import { Accordion } from "@/components/shared/accordion";
import { Badge } from "@/components/shared/badge";
import { LinkButton } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { SectionHeader } from "@/components/shared/section-header";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolLogo } from "@/components/tools/tool-logo";
import { articleCover, getArticle, getReadingTime } from "@/data/articles";
import { automationAreas, automationFaqs, automationIntro, workflowExamples } from "@/data/automation";
import { getArticleCategory, getGuideCategory } from "@/data/categories";
import { getGuide, guideCover } from "@/data/guides";
import { faqSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";
import { getToolsBySlugs, getToolsInCategory } from "@/lib/tools";
import { readingTimeFromSections } from "@/lib/utils";

export const metadata: Metadata = createMetadata({
  title: "AI Automation — Workflows for Business, Marketing, Sales & Support",
  description:
    "Learn workflow automation with AI: business, marketing, sales and customer support automation, no-code platforms, real workflow blueprints and tool recommendations.",
  path: "/automation",
});

const readingSlugs = {
  articles: ["what-is-ai-workflow-automation", "zapier-vs-make-vs-n8n"],
  guides: ["how-to-automate-email-follow-ups-with-zapier", "how-to-build-a-lead-routing-workflow-with-make", "how-to-self-host-n8n-with-docker"],
};

export default function AutomationPage() {
  const automationTools = getToolsInCategory("ai-automation");
  const reading = [
    ...readingSlugs.articles.map((slug) => getArticle(slug)).filter((a) => a !== undefined).map((a) => ({
      href: `/blog/${a.slug}`,
      title: a.title,
      excerpt: a.excerpt,
      cover: articleCover(a.slug),
      categoryLabel: getArticleCategory(a.category)?.name ?? "Article",
      publishedAt: a.publishedAt,
      readingTime: getReadingTime(a),
    })),
    ...readingSlugs.guides.map((slug) => getGuide(slug)).filter((g) => g !== undefined).map((g) => ({
      href: `/guides/${g.slug}`,
      title: g.title,
      excerpt: g.excerpt,
      cover: guideCover(g.slug),
      categoryLabel: getGuideCategory(g.category)?.name ?? "Guide",
      publishedAt: g.publishedAt,
      readingTime: readingTimeFromSections(g.intro, g.sections),
      meta: g.difficulty,
    })),
  ];

  return (
    <>
      <JsonLd data={faqSchema(automationFaqs)} />
      <PageHero
        eyebrow="AI automation"
        title={
          <>
            Automate the busywork. <span className="text-gradient">Keep the judgement.</span>
          </>
        }
        description="A practical resource for automating workflows with AI — the concepts, the platforms and ready-to-build blueprints for business, marketing, sales and customer support."
        breadcrumbs={[{ name: "AI Automation", href: "/automation" }]}
      >
        <div className="flex flex-wrap gap-3">
          <LinkButton href="#workflow-examples">
            Browse workflow blueprints <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
          <LinkButton href="/tools/category/ai-automation" variant="outline">
            Automation tools
          </LinkButton>
        </div>
      </PageHero>

      {/* Intro */}
      <section className="container-site grid gap-12 py-20 lg:grid-cols-2" aria-labelledby="intro-heading">
        <Reveal>
          <h2 id="intro-heading" className="text-3xl font-semibold tracking-tight text-foreground">
            {automationIntro.title}
          </h2>
          <div className="mt-5 space-y-4 text-[1.0625rem] leading-relaxed text-muted-foreground">
            {automationIntro.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-medium" aria-label="Anatomy of a workflow">
            {[
              { icon: Zap, label: "Trigger" },
              { icon: Sparkles, label: "AI step" },
              { icon: CircleCheck, label: "Human review" },
              { icon: Flag, label: "Action" },
            ].map((step, i, all) => (
              <span key={step.label} className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-foreground shadow-soft">
                  <step.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {step.label}
                </span>
                {i < all.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
              </span>
            ))}
          </div>
        </Reveal>
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {automationIntro.principles.map((p, i) => (
            <StaggerItem key={p.title}>
              <div className="h-full rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft">
                <span className="text-sm font-semibold text-primary">0{i + 1}</span>
                <h3 className="mt-2 font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Areas */}
      <section className="border-y border-border/60 bg-surface-muted/40 py-20" aria-labelledby="areas-heading">
        <div className="container-site">
          <SectionHeader
            eyebrow="Where automation helps"
            title={<span id="areas-heading">Automation across your business</span>}
            description="Each area below lists proven starting points and the tools commonly used to build them."
          />
          <nav aria-label="Automation areas" className="mb-10 flex flex-wrap gap-2">
            {automationAreas.map((a) => (
              <a key={a.id} href={`#${a.id}`} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                {a.title}
              </a>
            ))}
          </nav>
          <div className="space-y-6">
            {automationAreas.map((area) => {
              const areaTools = getToolsBySlugs(area.tools);
              return (
                <Reveal key={area.id} as="article" className="grid gap-8 rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft sm:p-8 lg:grid-cols-[1fr_1fr]">
                  <div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
                      <Icon name={area.icon} className="h-5 w-5" />
                    </span>
                    <h3 id={area.id} className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                      {area.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{area.summary}</p>
                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Commonly used tools</p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {areaTools.map((tool) => (
                          <li key={tool.slug}>
                            <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                              <ToolLogo tool={tool} size="sm" className="!h-7 !w-7 !rounded-full !text-[0.6rem]" />
                              {tool.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <ul className="grid content-start gap-3">
                    {area.examples.map((ex) => (
                      <li key={ex} className="flex gap-3 rounded-xl border border-border bg-surface-muted/40 p-4 text-sm text-foreground">
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow examples */}
      <section id="workflow-examples" className="container-site py-20" aria-labelledby="workflows-heading">
        <SectionHeader
          eyebrow="Blueprints"
          title={<span id="workflows-heading">Workflow examples you can build today</span>}
          description="Each blueprint lists the trigger, the steps and where a person should stay in the loop. Rebuild them in any major automation platform."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {workflowExamples.map((wf) => (
            <Reveal key={wf.id} as="article" className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">{wf.area}</Badge>
                <Badge>{wf.difficulty}</Badge>
              </div>
              <h3 id={wf.id} className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                {wf.title}
              </h3>
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-warning/10 px-3.5 py-2.5 text-sm text-foreground">
                <Zap className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                <span>
                  <span className="font-medium">Trigger:</span> {wf.trigger}
                </span>
              </p>
              <ol className="relative mt-4 space-y-3 border-l border-dashed border-border-strong pl-6">
                {wf.steps.map((step, i) => (
                  <li key={step} className="relative text-sm text-foreground">
                    <span className="absolute -left-[2.15rem] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Outcome:</span> {wf.outcome}
              </p>
              <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                Build with:
                {getToolsBySlugs(wf.tools).map((t) => (
                  <Link key={t.slug} href={`/tools/${t.slug}`} className="font-medium text-primary hover:underline">
                    {t.name}
                  </Link>
                ))}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <ServiceCta
        className="pt-0"
        title="Need this workflow implemented?"
        description="We can build any of these blueprints — or your own variation — in Zapier, Make or n8n, connected to the tools you already use, with a fixed quote before we start."
        ctaLabel="Get it built for you"
        location="automation-hub"
      />

      {/* Related tools */}
      <section className="border-t border-border/60 bg-surface-muted/40 py-20" aria-labelledby="automation-tools-heading">
        <div className="container-site">
          <SectionHeader
            eyebrow="Platforms"
            title={<span id="automation-tools-heading">Related automation tools</span>}
            action={
              <LinkButton href="/tools/category/ai-automation" variant="outline" size="sm">
                See all <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            }
          />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {automationTools.map((tool) => (
              <StaggerItem key={tool.slug}>
                <ToolCard tool={tool} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Reading */}
      <section className="container-site py-20" aria-labelledby="automation-reading-heading">
        <SectionHeader eyebrow="Keep learning" title={<span id="automation-reading-heading">Automation guides &amp; articles</span>} />
        <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reading.slice(0, 6).map((item) => (
            <StaggerItem key={item.href}>
              <ContentCard item={item} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* FAQ */}
      <section className="container-site max-w-3xl pb-8" aria-labelledby="automation-faq-heading">
        <SectionHeader align="center" title={<span id="automation-faq-heading">Automation FAQ</span>} />
        <Reveal>
          <Accordion items={automationFaqs} />
        </Reveal>
      </section>
    </>
  );
}
