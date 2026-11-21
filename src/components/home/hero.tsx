import { ArrowRight, Sparkles, Workflow } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/shared/button";
import { AmbientBackground } from "@/components/shared/background";
import { Counter } from "@/components/shared/counter";
import { HeroSearch } from "./hero-search";
import { HeroVisual } from "./hero-visual";

export interface HeroStat {
  label: string;
  value: number;
  suffix?: string;
}

export function Hero({ stats }: { stats: HeroStat[] }) {
  return (
    <section className="relative isolate overflow-hidden">
      <AmbientBackground />
      <div className="container-site grid items-center gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-28 lg:pt-20">
        <div>
          <Link
            href="/services"
            data-track="consultation_click"
            data-track-location="home-hero"
            className="group inline-flex animate-fade-up items-center gap-2 rounded-full border border-primary/20 bg-surface/70 py-1 pl-1 pr-3 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-semibold text-white dark:text-primary-foreground">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> New
            </span>
            Hire us: done-for-you automation services
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <h1 className="mt-6 animate-fade-up text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-foreground text-balance [animation-delay:80ms] sm:text-6xl lg:text-[4.1rem]">
            Discover the Future of <span className="text-gradient animate-gradient">AI &amp; Automation</span>
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-muted-foreground text-pretty [animation-delay:160ms]">
            Explore powerful AI tools, discover smarter workflows, and learn how automation can transform the way you work.
            Everything you need to work smarter starts here.
          </p>
          <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
            <LinkButton href="/tools" size="lg">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Explore AI Tools
              <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" aria-hidden="true" />
            </LinkButton>
            <LinkButton href="/automation" size="lg" variant="outline">
              <Workflow className="h-4 w-4" aria-hidden="true" />
              Explore Automation
            </LinkButton>
          </div>
          <div className="mt-10 max-w-xl animate-fade-up [animation-delay:320ms]">
            <HeroSearch />
          </div>
          <dl className="mt-10 grid max-w-xl animate-fade-up grid-cols-2 gap-6 border-t border-border pt-8 [animation-delay:400ms] sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
