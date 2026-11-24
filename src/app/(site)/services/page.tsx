import { ArrowRight, CalendarCheck, Check, CircleCheck, Clock3, FileText, KeyRound, Mail, MessageCircle, Repeat, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/services/inquiry-form";
import { ServiceCta, WhatsAppButton } from "@/components/services/service-cta";
import { TrackOnMount } from "@/components/shared/analytics-listener";
import { Accordion } from "@/components/shared/accordion";
import { LinkButton } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { SectionHeader } from "@/components/shared/section-header";
import { monthlyPlans, pricingPackages, processSteps, serviceFaqs, serviceQuoteHref, services, useCases } from "@/data/services";
import { siteConfig } from "@/data/site";
import { trackAttrs } from "@/lib/analytics";
import { bookingLink, whatsappLink } from "@/lib/contact";
import { faqSchema, servicesSchema } from "@/lib/schema";
import { createMetadata } from "@/lib/seo";
import { getToolsBySlugs } from "@/lib/tools";
import { cn } from "@/lib/utils";

const description =
  "Done-for-you AI and workflow automation: n8n, Make.com and Zapier integrations, CRM and email automation, AI chatbots and custom AI solutions. Fixed written quote before work starts.";

export const metadata: Metadata = createMetadata({
  title: "AI Automation Services — n8n, Make, Zapier, CRM & AI Chatbots",
  description,
  path: "/services",
});

const promises = [
  { icon: Repeat, text: "Monthly plans — cancel with 30 days' notice" },
  { icon: FileText, text: "Fixed written quote before work starts" },
  { icon: KeyRound, text: "Built in accounts you own" },
  { icon: ShieldCheck, text: "Documentation and handover included" },
];

export default function ServicesPage() {
  const whatsapp = whatsappLink("Hi WebAIAutomation, I'd like to discuss an automation project.");
  const booking = bookingLink();

  return (
    <>
      <JsonLd data={[servicesSchema(services, pricingPackages, description), faqSchema(serviceFaqs)]} />
      <TrackOnMount event="services_page_view" />

      <PageHero
        eyebrow="Automation services"
        title={
          <>
            We build your automations. <span className="text-gradient">You get back to work.</span>
          </>
        }
        description="Done-for-you AI and workflow automation — n8n, Make.com, Zapier, CRM, chatbots and email — designed around how your business already works."
        breadcrumbs={[{ name: "Automation Services", href: "/services" }]}
      >
        <div className="flex flex-wrap gap-3">
          <LinkButton href="#quote" size="lg" {...trackAttrs("consultation_click", { location: "services-hero" })}>
            Request a quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
          {booking && (
            <LinkButton href={booking} external size="lg" variant="outline" {...trackAttrs("booking_click", { location: "services-hero" })}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Book a free call
            </LinkButton>
          )}
          <WhatsAppButton location="services-hero" />
          <LinkButton href="#monthly-plans" size="lg" variant="ghost">
            See monthly plans
          </LinkButton>
        </div>
        <ul className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-6">
          {promises.map((p) => (
            <li key={p.text} className="flex items-center gap-2">
              <p.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              {p.text}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* Services */}
      <section id="services-list" className="container-site scroll-mt-24 py-20" aria-labelledby="services-heading">
        <SectionHeader
          eyebrow="What we build"
          title={<span id="services-heading">Automation services for growing businesses</span>}
          description="Each service starts with your real process and ends with a working, documented system in your own accounts."
        />
        <nav aria-label="Services" className="mb-10 flex flex-wrap gap-2">
          {services.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary">
              {s.title}
            </a>
          ))}
        </nav>
        <div className="grid gap-6 lg:grid-cols-2">
          {services.map((service) => {
            const tools = getToolsBySlugs(service.tools);
            return (
              <Reveal key={service.id} as="article" className="flex h-full flex-col rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft sm:p-8">
                <div id={service.id} className="flex scroll-mt-36 items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
                    <Icon name={service.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">{service.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
                  </div>
                </div>

                <dl className="mt-6 space-y-4 text-sm leading-relaxed">
                  <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">The problem</dt>
                    <dd className="mt-1.5 text-foreground/90">{service.problem}</dd>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Our solution</dt>
                    <dd className="mt-1.5 text-foreground/90">{service.solution}</dd>
                  </div>
                </dl>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Deliverables</h4>
                    <ul className="mt-3 space-y-2">
                      {service.deliverables.map((d) => (
                        <li key={d} className="flex gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Business benefits</h4>
                    <ul className="mt-3 space-y-2">
                      {service.benefits.map((b) => (
                        <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {tools.length > 0 ? (
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      Often built with:
                      {tools.map((t) => (
                        <Link key={t.slug} href={`/tools/${t.slug}`} className="font-medium text-foreground hover:text-primary">
                          {t.name}
                        </Link>
                      ))}
                    </p>
                  ) : (
                    <span />
                  )}
                  <LinkButton href={serviceQuoteHref(service.id)} size="sm" className="shrink-0" {...trackAttrs("consultation_click", { location: "services-card", service: service.id })}>
                    Request a quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </LinkButton>
                </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Monthly plans */}
      <section id="monthly-plans" className="scroll-mt-24 border-y border-border/60 bg-surface-muted/40 py-20" aria-labelledby="plans-heading">
        <div className="container-site">
          <SectionHeader
            align="center"
            eyebrow="Monthly plans"
            title={<span id="plans-heading">Done-for-you automation, every month</span>}
            description="One predictable monthly price. We build it, host it, keep it running and keep improving it — so you never have to think about it."
          />
          <Stagger className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {monthlyPlans.map((plan) => (
              <StaggerItem key={plan.id}>
                <div className={cn("relative flex h-full flex-col rounded-[1.5rem] border bg-surface p-7 shadow-soft", plan.highlighted ? "border-primary/50 ring-4 ring-primary/10" : "border-border")}>
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white dark:text-primary-foreground">Most popular</span>
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.bestFor}</p>
                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight text-foreground">${plan.monthlyPrice}</span>
                    <span className="text-sm text-muted-foreground">USD / month</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.setupFee ? `+ $${plan.setupFee} one-time setup` : "No setup fee"}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.includes.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-foreground/90">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <LinkButton
                    href={serviceQuoteHref(plan.id, plan.budget)}
                    variant={plan.highlighted ? "primary" : "outline"}
                    className="mt-8 w-full"
                    {...trackAttrs("consultation_click", { location: "monthly-plans", plan: plan.id })}
                  >
                    Start with {plan.name}
                  </LinkButton>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
            Prices in USD; we also invoice in GBP, AUD and EUR. Pay each month by card or bank transfer from the secure link on your invoice. No long contracts —
            change or cancel your plan with 30 days&apos; notice.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 py-20" aria-labelledby="pricing-heading">
        <div className="container-site">
          <SectionHeader
            align="center"
            eyebrow="One-time projects"
            title={<span id="pricing-heading">Prefer a one-off build? Simple starting prices</span>}
            description="Every project is different, so these are starting points rather than fixed prices. You'll receive a written quote with the exact scope and price before anything is built."
          />
          <Stagger className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {pricingPackages.map((pkg) => (
              <StaggerItem key={pkg.id}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-[1.5rem] border bg-surface p-7 shadow-soft",
                    pkg.highlighted ? "border-primary/50 ring-4 ring-primary/10" : "border-border",
                  )}
                >
                  <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{pkg.bestFor}</p>
                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-sm text-muted-foreground">from</span>
                    <span className="text-4xl font-semibold tracking-tight text-foreground">${pkg.fromPrice}</span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">One-time project price</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-foreground/90">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <LinkButton
                    href={serviceQuoteHref(undefined, pkg.budget)}
                    variant={pkg.highlighted ? "primary" : "outline"}
                    className="mt-8 w-full"
                    {...trackAttrs("consultation_click", { location: "pricing", package: pkg.id })}
                  >
                    Get a {pkg.name} quote
                  </LinkButton>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
            Prices are in USD and indicative only. <strong className="font-medium text-foreground">Final prices depend on your project requirements</strong>{" "}
            and are confirmed in a written quote before work begins. Subscriptions for third-party tools (for example Zapier, Make, n8n Cloud, your CRM or AI
            model APIs) are billed by those providers and aren&apos;t included.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container-site scroll-mt-24 py-20" aria-labelledby="process-heading">
        <SectionHeader
          eyebrow="How it works"
          title={<span id="process-heading">From first message to working automation</span>}
          description="A clear, low-risk process: you see the scope and price before you commit."
        />
        <Stagger as="ol" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map((step, i) => (
            <StaggerItem as="li" key={step.title}>
              <div className="h-full rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{i + 1}</span>
                <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Use cases */}
      <section className="border-y border-border/60 bg-surface-muted/40 py-20" aria-labelledby="use-cases-heading">
        <div className="container-site">
          <SectionHeader
            eyebrow="Business use cases"
            title={<span id="use-cases-heading">Ideas for what you could automate</span>}
            description={
              <>
                Typical starting points by business type. Want more detail? Browse the{" "}
                <Link href="/automation#workflow-examples" className="font-medium text-primary hover:underline">
                  workflow blueprints
                </Link>{" "}
                in our automation hub.
              </>
            }
          />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <StaggerItem key={uc.title}>
                <div className="h-full rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon name={uc.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{uc.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {uc.examples.map((ex) => (
                      <li key={ex} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Quote form */}
      <section id="quote" className="container-site scroll-mt-24 py-20" aria-labelledby="quote-heading">
        <SectionHeader
          eyebrow="Consultation"
          title={<span id="quote-heading">Request a quote or consultation</span>}
          description="Tell us about the task you want automated. We'll reply to discuss your requirements before quoting — there's no obligation."
        />
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <Reveal className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft sm:p-8">
            <InquiryForm kind="service" whatsappHref={whatsapp} />
          </Reveal>
          <aside className="space-y-5">
            <Reveal delay={0.05} className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
              <h3 className="font-semibold text-foreground">What happens next</h3>
              <ol className="mt-4 space-y-4 text-sm">
                {[
                  { icon: Mail, text: "We read your request and reply using your preferred contact method." },
                  { icon: Clock3, text: "We discuss your process and confirm what's feasible." },
                  { icon: FileText, text: "You receive a written quote with scope, price and timeline." },
                ].map((s) => (
                  <li key={s.text} className="flex gap-3 text-muted-foreground">
                    <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {s.text}
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={0.1} className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
              <h3 className="font-semibold text-foreground">Prefer to talk directly?</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {whatsapp && (
                  <li>
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-medium text-foreground hover:text-primary" {...trackAttrs("whatsapp_click", { location: "services-quote-aside" })}>
                      <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" /> WhatsApp us
                    </a>
                  </li>
                )}
                <li>
                  <a href={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Automation project inquiry")}`} className="flex items-center gap-3 font-medium text-foreground hover:text-primary">
                    <Mail className="h-4 w-4 text-primary" aria-hidden="true" /> {siteConfig.email}
                  </a>
                </li>
              </ul>
            </Reveal>
          </aside>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-site max-w-3xl pb-4" aria-labelledby="services-faq-heading">
        <SectionHeader align="center" eyebrow="FAQ" title={<span id="services-faq-heading">Frequently asked questions</span>} />
        <Reveal>
          <Accordion items={serviceFaqs} />
        </Reveal>
      </section>

      <ServiceCta
        title="Ready to automate your first workflow?"
        description="Describe one task your team repeats every week. We'll tell you whether it's worth automating and what it would cost."
        ctaLabel="Book a consultation"
        location="services-footer"
      />
    </>
  );
}
