import { ArrowRight, FileText, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { WhatsAppButton } from "@/components/services/service-cta";
import { LinkButton } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { SectionHeader } from "@/components/shared/section-header";
import type { Service } from "@/data/services";
import { trackAttrs } from "@/lib/analytics";

/** Homepage block promoting the done-for-you automation services. */
export function ServicesSection({ services, fromPrice }: { services: Service[]; fromPrice: number }) {
  return (
    <section className="container-site py-20 sm:py-24" aria-labelledby="home-services-heading">
      <SectionHeader
        eyebrow="Automation services"
        title={<span id="home-services-heading">Don&apos;t have time to build it? We&apos;ll build it for you.</span>}
        description="Done-for-you AI and workflow automation, built in your own accounts with a fixed written quote before work starts."
        action={
          <LinkButton href="/services" variant="outline" size="sm">
            All services <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        }
      />
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <StaggerItem key={service.id}>
            <Link
              href={`/services#${service.id}`}
              className="group flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                <Icon name={service.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold tracking-tight text-foreground group-hover:text-primary">{service.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal className="mt-8 flex flex-col gap-6 rounded-[1.5rem] border border-primary/25 bg-gradient-to-br from-primary-soft via-surface to-surface p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xl font-semibold tracking-tight text-foreground">
            Automation projects from <span className="text-gradient">${fromPrice}</span>
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-5">
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> Fixed written quote
            </li>
            <li className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" /> Built in your accounts
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Documented handover
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/services#quote" size="lg" {...trackAttrs("consultation_click", { location: "home-services" })}>
            Hire us <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
          <WhatsAppButton location="home-services" />
        </div>
      </Reveal>
    </section>
  );
}
