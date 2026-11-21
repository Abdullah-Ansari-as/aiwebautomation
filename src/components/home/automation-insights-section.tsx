import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import { LinkButton } from "@/components/shared/button";
import { SectionHeader } from "@/components/shared/section-header";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import type { WorkflowExample } from "@/data/automation";

export function AutomationInsightsSection({
  workflows,
  guides,
}: {
  workflows: WorkflowExample[];
  guides: { title: string; href: string; meta: string }[];
}) {
  return (
    <section className="relative isolate overflow-hidden bg-[#070b1f] py-20 text-white sm:py-24" aria-labelledby="automation-insights-heading">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
        <div className="absolute -left-40 top-0 h-96 w-96 animate-float-slow rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 animate-float-slow rounded-full bg-blue-600/25 blur-3xl [animation-delay:-5s]" />
      </div>
      <div className="container-site dark">
        <SectionHeader
          eyebrow="Automation insights"
          title={<span id="automation-insights-heading">Workflows worth automating this week</span>}
          description="Practical blueprints that combine triggers, AI steps and human review. Rebuild them in the automation platform you already use."
          action={
            <LinkButton href="/automation" size="sm">
              Explore automation <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
          }
        />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Stagger className="grid gap-5 md:grid-cols-3">
            {workflows.map((wf) => (
              <StaggerItem key={wf.id}>
                <Link
                  href={`/automation#${wf.id}`}
                  className="group flex h-full flex-col rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-[transform,background-color,border-color] duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <Badge tone="primary">{wf.area}</Badge>
                    <span className="text-xs text-slate-400">{wf.difficulty}</span>
                  </div>
                  <h3 className="mt-4 font-semibold leading-snug text-white">{wf.title}</h3>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <Zap className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> {wf.trigger}
                  </p>
                  <ol className="mt-4 flex-1 space-y-2 text-sm text-slate-300">
                    {wf.steps.slice(0, 3).map((step, i) => (
                      <li key={step} className="flex gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.65rem] font-semibold">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-violet-300">
                    See blueprint
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="rounded-[var(--radius-card)] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6">
            <h3 className="font-semibold text-white">Automation guides</h3>
            <ul className="mt-4 divide-y divide-white/10">
              {guides.map((g) => (
                <li key={g.href}>
                  <Link href={g.href} className="group flex items-start justify-between gap-3 py-3.5">
                    <span>
                      <span className="block text-sm font-medium text-slate-100 transition-colors group-hover:text-violet-300">{g.title}</span>
                      <span className="mt-1 block text-xs text-slate-400">{g.meta}</span>
                    </span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:text-violet-300" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
