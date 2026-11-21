import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PricingModel } from "@/types";

type Tone = "neutral" | "primary" | "accent" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-muted-foreground border-border",
  primary: "bg-primary-soft text-primary border-primary/20",
  accent: "bg-accent-soft text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/20",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const pricingTone: Record<PricingModel, Tone> = { Free: "success", Freemium: "accent", Paid: "warning" };

export function PricingBadge({ pricing, className }: { pricing: PricingModel; className?: string }) {
  return (
    <Badge tone={pricingTone[pricing]} className={className}>
      {pricing}
    </Badge>
  );
}
