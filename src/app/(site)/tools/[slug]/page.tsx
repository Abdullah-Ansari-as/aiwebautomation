import { ArrowUpRight, Calendar, Check, CircleCheck, CircleX, Layers, Monitor, Tag, Target, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "@/components/blog/article-card";
import { Badge, PricingBadge } from "@/components/shared/badge";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { LinkButton } from "@/components/shared/button";
import { AmbientBackground } from "@/components/shared/background";
import { JsonLd } from "@/components/shared/json-ld";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolLogo } from "@/components/tools/tool-logo";
import { getArticlesMentioningTool, toArticleSummary } from "@/data/articles";
import { getArticleCategory, getToolCategory } from "@/data/categories";
import { tools } from "@/data/tools";
import { getAffiliateLink } from "@/lib/affiliate";
import { trackAttrs } from "@/lib/analytics";
import { toolSoftwareSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";
import { getRelatedTools, getTool, getToolsBySlugs } from "@/lib/tools";
import { formatDate } from "@/lib/utils";

/**
 * Every slug is prerendered via generateStaticParams; allowing this segment to
 * block on `params` during client navigation keeps the full article/tool HTML
 * in the static output instead of a Suspense placeholder.
 */
export const instant = false;

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };
  return createMetadata({
    title: `${tool.name} Review: Features, Pricing, Pros & Cons`,
    description: `${tool.description} See ${tool.name}'s key features, pricing model, pros, cons and alternatives.`.slice(0, 300),
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolDetailPage({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const category = getToolCategory(tool.category);
  const alternatives = getToolsBySlugs(tool.alternatives);
  const related = getRelatedTools(tool, 3);
  const mentions = getArticlesMentioningTool(tool.slug).slice(0, 3).map(toArticleSummary);
  const affiliate = getAffiliateLink(tool);
  const affiliateAttrs = affiliate ? { rel: "sponsored noopener noreferrer", ...trackAttrs("affiliate_click", { tool: tool.slug }) } : {};

  const facts = [
    { icon: Layers, label: "Category", value: category?.name ?? "—", href: `/tools/category/${tool.category}` },
    { icon: Wallet, label: "Pricing model", value: tool.pricing },
    { icon: Monitor, label: "Platforms", value: tool.platforms.join(", ") },
    { icon: Tag, label: "Developer", value: tool.developer },
    { icon: Calendar, label: "Listed since", value: formatDate(tool.addedAt) },
  ];

  const sectionNav = [
    { id: "overview", label: "Overview" },
    { id: "features", label: "Features" },
    { id: "pricing", label: "Pricing" },
    { id: "pros-cons", label: "Pros & cons" },
    { id: "use-cases", label: "Use cases" },
    { id: "alternatives", label: "Alternatives" },
  ];

  return (
    <>
      <JsonLd data={toolSoftwareSchema(tool)} />

      <section className="relative isolate overflow-hidden border-b border-border/60">
        <AmbientBackground intensity="subtle" />
        <div
          aria-hidden="true"
          className="absolute -top-32 right-0 -z-10 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: tool.brandColors[0] }}
        />
        <div className="container-site pb-12 pt-10">
          <Breadcrumbs
            className="animate-fade-up"
            items={[
              { name: "AI Tools", href: "/tools" },
              ...(category ? [{ name: category.name, href: `/tools/category/${category.slug}` }] : []),
              { name: tool.name, href: `/tools/${tool.slug}` },
            ]}
          />
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex animate-fade-up flex-col gap-6 sm:flex-row sm:items-center [animation-delay:60ms]">
              <ToolLogo tool={tool} size="xl" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <PricingBadge pricing={tool.pricing} />
                  {category && <Badge tone="primary">{category.name}</Badge>}
                  {tool.featured && <Badge tone="neutral">Editor&apos;s pick</Badge>}
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{tool.name}</h1>
                <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{tool.tagline}</p>
              </div>
            </div>
            <div className="animate-fade-up [animation-delay:120ms]">
              <div className="flex flex-wrap gap-3">
                {affiliate ? (
                  <LinkButton href={affiliate.href} external size="lg" {...affiliateAttrs}>
                    {affiliate.label} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </LinkButton>
                ) : (
                  <LinkButton href={tool.website} external size="lg">
                    Visit official website <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </LinkButton>
                )}
                <LinkButton href="#alternatives" variant="outline" size="lg">
                  Compare alternatives
                </LinkButton>
              </div>
              {affiliate && (
                <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
                  {affiliate.disclosure}{" "}
                  <Link href="/disclaimer#independence" className="underline hover:text-foreground">
                    Learn more
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl lg:top-[4.5rem]">
        <nav aria-label="Sections" className="container-site flex gap-1 overflow-x-auto py-2">
          {sectionNav.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="container-site grid gap-12 py-12 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-16">
          <Reveal as="section">
            <h2 id="overview" className="text-2xl font-semibold tracking-tight text-foreground">
              What is {tool.name}?
            </h2>
            <div className="mt-5 space-y-4 text-[1.0625rem] leading-relaxed text-muted-foreground">
              {tool.overview.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>

          <section>
            <Reveal>
              <h2 id="features" className="text-2xl font-semibold tracking-tight text-foreground">
                Key features
              </h2>
            </Reveal>
            <Stagger as="ul" className="mt-6 grid gap-3 sm:grid-cols-2">
              {tool.features.map((feature) => (
                <StaggerItem as="li" key={feature}>
                  <div className="flex h-full gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/30">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-sm leading-relaxed text-foreground">{feature}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </section>

          <Reveal as="section">
            <h2 id="pricing" className="text-2xl font-semibold tracking-tight text-foreground">
              Pricing
            </h2>
            <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-6">
              <div className="flex items-center gap-3">
                <PricingBadge pricing={tool.pricing} />
                <span className="text-sm font-medium text-foreground">Pricing model</span>
              </div>
              <p className="mt-4 leading-relaxed text-muted-foreground">{tool.pricingDetails}</p>
              <a
                href={tool.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Check current pricing on the official site <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </Reveal>

          <section>
            <Reveal>
              <h2 id="pros-cons" className="text-2xl font-semibold tracking-tight text-foreground">
                Pros and cons
              </h2>
            </Reveal>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Reveal className="rounded-[var(--radius-card)] border border-success/25 bg-success/5 p-6">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <CircleCheck className="h-5 w-5 text-success" aria-hidden="true" /> Pros
                </h3>
                <ul className="mt-4 space-y-3">
                  {tool.pros.map((pro) => (
                    <li key={pro} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.08} className="rounded-[var(--radius-card)] border border-danger/25 bg-danger/5 p-6">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <CircleX className="h-5 w-5 text-danger" aria-hidden="true" /> Cons
                </h3>
                <ul className="mt-4 space-y-3">
                  {tool.cons.map((con) => (
                    <li key={con} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                      {con}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>

          <Reveal as="section">
            <h2 id="use-cases" className="text-2xl font-semibold tracking-tight text-foreground">
              Best use cases
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {tool.useCases.map((u) => (
                <li
                  key={u}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground"
                >
                  <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                  {u}
                </li>
              ))}
            </ul>
          </Reveal>

          <section>
            <Reveal>
              <h2 id="alternatives" className="text-2xl font-semibold tracking-tight text-foreground">
                {tool.name} alternatives
              </h2>
              <p className="mt-2 text-muted-foreground">Other tools worth comparing before you decide.</p>
            </Reveal>
            <Stagger className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {alternatives.map((alt) => (
                <StaggerItem key={alt.slug}>
                  <ToolCard tool={alt} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start" aria-label={`${tool.name} quick facts`}>
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Quick facts</h2>
            <dl className="mt-5 space-y-4">
              {facts.map((f) => (
                <div key={f.label} className="flex gap-3">
                  <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{f.label}</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {f.href ? (
                        <Link href={f.href} className="hover:text-primary">
                          {f.value}
                        </Link>
                      ) : (
                        f.value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
            {affiliate ? (
              <LinkButton href={affiliate.href} external className="mt-6 w-full" {...affiliateAttrs}>
                {affiliate.label} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            ) : (
              <LinkButton href={tool.website} external className="mt-6 w-full">
                Visit {tool.name} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {affiliate ? (
                <>
                  <span className="font-medium text-foreground">Affiliate disclosure:</span> {affiliate.disclosure}
                </>
              ) : (
                <>We aren&apos;t affiliated with {tool.developer}.</>
              )}{" "}
              Features and pricing change — verify details on the official website.
            </p>
          </div>
        </aside>
      </div>

      {(related.length > 0 || mentions.length > 0) && (
        <div className="container-site space-y-16 pb-8">
          {related.length > 0 && (
            <section aria-labelledby="related-tools">
              <h2 id="related-tools" className="text-2xl font-semibold tracking-tight text-foreground">
                Related tools
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </section>
          )}
          {mentions.length > 0 && (
            <section aria-labelledby="tool-articles">
              <h2 id="tool-articles" className="text-2xl font-semibold tracking-tight text-foreground">
                Articles featuring {tool.name}
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {mentions.map((a) => (
                  <ContentCard
                    key={a.slug}
                    item={{
                      href: `/blog/${a.slug}`,
                      title: a.title,
                      excerpt: a.excerpt,
                      cover: a.cover,
                      categoryLabel: getArticleCategory(a.category)?.name ?? "Article",
                      publishedAt: a.publishedAt,
                      readingTime: a.readingTime,
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
