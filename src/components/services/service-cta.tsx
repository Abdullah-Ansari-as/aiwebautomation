import { ArrowRight, MessageCircle, Workflow } from "lucide-react";
import { LinkButton, buttonClasses } from "@/components/shared/button";
import { Reveal } from "@/components/shared/reveal";
import { serviceQuoteHref } from "@/data/services";
import { trackAttrs } from "@/lib/analytics";
import { whatsappLink } from "@/lib/contact";
import { cn } from "@/lib/utils";

/** WhatsApp click-to-chat link. Renders nothing until a number is configured. */
export function WhatsAppButton({
  location,
  message = "Hi WebAIAutomation, I'd like to discuss an automation project.",
  variant = "outline",
  size = "lg",
  className,
  label = "Chat on WhatsApp",
}: {
  location: string;
  message?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "md" | "lg";
  className?: string;
  label?: string;
}) {
  const href = whatsappLink(message);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant, size, className })} {...trackAttrs("whatsapp_click", { location })}>
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}

/**
 * Contextual "get this built for you" call to action. `band` is a full-width
 * section; `inline` sits inside article content.
 */
export function ServiceCta({
  title,
  description,
  serviceId,
  ctaLabel = "Request a quote",
  location,
  variant = "band",
  className,
}: {
  title: string;
  description: string;
  serviceId?: string;
  ctaLabel?: string;
  /** Where the CTA is shown, for analytics. */
  location: string;
  variant?: "band" | "inline";
  className?: string;
}) {
  const href = serviceQuoteHref(serviceId);

  if (variant === "inline") {
    return (
      <aside aria-label="Automation services" className={cn("relative overflow-hidden rounded-[var(--radius-card)] border border-primary/25 bg-primary-soft/60 p-6 sm:p-7", className)}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
              <Workflow className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
          <LinkButton href={href} className="shrink-0" {...trackAttrs("consultation_click", { location, service: serviceId ?? "" })}>
            {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        </div>
      </aside>
    );
  }

  return (
    <section className={cn("container-site py-16", className)} aria-label="Automation services">
      <Reveal className="relative isolate overflow-hidden rounded-[1.75rem] border border-border bg-surface p-8 shadow-soft sm:p-12">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgb(109_74_255/0.16),transparent),radial-gradient(ellipse_50%_70%_at_0%_100%,rgb(47_107_255/0.12),transparent)]" />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="h-px w-6 bg-gradient-to-r from-primary to-accent" aria-hidden="true" />
              Done-for-you automation
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">{title}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">{description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <LinkButton href={href} size="lg" {...trackAttrs("consultation_click", { location, service: serviceId ?? "" })}>
              {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
            <WhatsAppButton location={location} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
