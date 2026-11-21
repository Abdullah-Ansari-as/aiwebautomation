import { ArrowRight, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/shared/button";
import { SectionHeader } from "@/components/shared/section-header";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { UtilityCard } from "@/components/utilities/utility-card";
import type { Utility } from "@/types";

export function UtilitiesSection({ utilities }: { utilities: Utility[] }) {
  return (
    <section className="container-site py-20 sm:py-24" aria-labelledby="utilities-heading">
      <SectionHeader
        eyebrow="Free on WebAIAutomation"
        title={<span id="utilities-heading">Free AI utilities, right in your browser</span>}
        description="Summarise text, write emails, build prompts, format JSON and more. Most tools run locally — your text never leaves your device."
        action={
          <LinkButton href="/free-ai-tools" variant="outline" size="sm">
            All utilities <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        }
      />
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {utilities.map((utility) => (
          <StaggerItem key={utility.slug}>
            <UtilityCard utility={utility} />
          </StaggerItem>
        ))}
      </Stagger>
      <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
        No sign-up required. Each tool shows whether it runs locally or uses templates.
      </p>
    </section>
  );
}
