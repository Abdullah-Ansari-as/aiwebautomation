import { Compass, GitCompareArrows, GraduationCap, Rocket } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { Stagger, StaggerItem } from "@/components/shared/reveal";

const reasons = [
  {
    icon: Compass,
    title: "Discover useful AI tools",
    text: "A curated directory with honest descriptions, clear pricing models and real use cases — no inflated claims.",
  },
  {
    icon: GraduationCap,
    title: "Learn practical automation",
    text: "Step-by-step guides and workflow blueprints you can rebuild in Zapier, Make or n8n the same day.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare AI solutions",
    text: "Pros, cons and alternatives for every tool so you can shortlist options quickly and confidently.",
  },
  {
    icon: Rocket,
    title: "Improve productivity",
    text: "Free browser-based utilities and proven habits that save time on writing, research and everyday tasks.",
  },
];

export function WhySection() {
  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-24" aria-labelledby="why-heading">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgb(109_74_255/0.12),transparent)]" />
      <div className="container-site">
        <SectionHeader
          align="center"
          eyebrow="Why WebAIAutomation?"
          title={<span id="why-heading">Clear guidance for a fast-moving AI landscape</span>}
          description="We help professionals and teams separate useful tools from noise, then put them to work with practical, repeatable workflows."
        />
        <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, i) => (
            <StaggerItem key={reason.title}>
              <div className="group relative h-full rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="text-xs font-semibold text-muted-foreground">0{i + 1}</span>
                <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                  <reason.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{reason.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
