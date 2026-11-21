import { ArrowRight, BadgeCheck, Eye, Lightbulb, Scale } from "lucide-react";
import type { Metadata } from "next";
import { LinkButton } from "@/components/shared/button";
import { Counter } from "@/components/shared/counter";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { SectionHeader } from "@/components/shared/section-header";
import { articles } from "@/data/articles";
import { toolCategories } from "@/data/categories";
import { guides } from "@/data/guides";
import { siteConfig } from "@/data/site";
import { tools } from "@/data/tools";
import { utilities } from "@/data/utilities";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Us — Our Mission",
  description:
    "WebAIAutomation helps professionals discover useful AI tools, learn practical automation and understand the technology shaping how we work.",
  path: "/about",
});

const values = [
  { icon: BadgeCheck, title: "Accuracy over hype", text: "We describe what tools actually do, avoid invented numbers and point readers to official sources." },
  { icon: Scale, title: "Independent by design", text: "Listings and recommendations can't be bought. Any future sponsorship will be clearly labelled." },
  { icon: Lightbulb, title: "Practical first", text: "Every guide aims to leave you with something you can build or apply the same day." },
  { icon: Eye, title: "Transparent", text: "We flag demo features, template-based tools and limitations instead of hiding them." },
];

const process = [
  { step: "Research", text: "We study the product's documentation, positioning and pricing structure on the official site." },
  { step: "Hands-on use", text: "Where possible, we use the tool on realistic tasks to understand strengths and trade-offs." },
  { step: "Write & compare", text: "We summarise features, pros, cons and alternatives in plain language." },
  { step: "Review & update", text: "Editors check accuracy before publishing and revisit listings as products change." },
];

export default function AboutPage() {
  const stats = [
    { label: "AI tools listed", value: tools.length },
    { label: "Tool categories", value: toolCategories.length },
    { label: "Articles & guides", value: articles.length + guides.length },
    { label: "Free utilities", value: utilities.length },
  ];

  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            Helping people work smarter with <span className="text-gradient">AI &amp; automation</span>
          </>
        }
        description={`${siteConfig.name} is an independent resource for discovering AI tools, learning practical automation and understanding the technology that's reshaping everyday work.`}
        breadcrumbs={[{ name: "About Us", href: "/about" }]}
      />

      <section className="container-site grid gap-12 py-20 lg:grid-cols-2" aria-labelledby="mission-heading">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Our mission</p>
          <h2 id="mission-heading" className="mt-3 text-3xl font-semibold tracking-tight text-foreground text-balance">
            Make AI genuinely useful — not just impressive
          </h2>
          <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-muted-foreground">
            <p>
              New AI products launch every week, and it&apos;s hard to tell which ones will actually save you time. We started{" "}
              {siteConfig.name} to cut through that noise with clear, honest information and step-by-step guidance.
            </p>
            <p>
              We cover the tools, the workflows that connect them, and the technology underneath — so professionals, teams and small
              businesses can adopt AI with confidence and keep people in control of the decisions that matter.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <dl className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft">
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
                  <Counter value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="border-y border-border/60 bg-surface-muted/40 py-20" aria-labelledby="values-heading">
        <div className="container-site">
          <SectionHeader align="center" eyebrow="What we stand for" title={<span id="values-heading">Our values</span>} />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <StaggerItem key={v.title}>
                <div className="h-full rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <v.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-semibold text-foreground">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="container-site py-20" aria-labelledby="process-heading">
        <SectionHeader eyebrow="How we work" title={<span id="process-heading">How we evaluate AI tools</span>} />
        <Stagger as="ol" className="grid gap-5 md:grid-cols-4">
          {process.map((p, i) => (
            <StaggerItem as="li" key={p.step}>
              <div className="relative h-full rounded-[var(--radius-card)] border border-border bg-surface p-6">
                <span className="text-gradient text-4xl font-semibold">{i + 1}</span>
                <h3 className="mt-3 font-semibold text-foreground">{p.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[1.5rem] border border-border bg-surface p-8 shadow-soft sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Want to know more about our standards?</h2>
            <p className="mt-1 text-muted-foreground">Read how we research, write and correct our content.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/editorial-policy" variant="outline">
              Editorial policy
            </LinkButton>
            <LinkButton href="/contact">
              Contact us <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
