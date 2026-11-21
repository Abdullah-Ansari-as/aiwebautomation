"use client";

import { m } from "framer-motion";
import { Bot, Check, Mail, Sparkles, Workflow, Zap } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const steps = [
  { icon: Zap, label: "Trigger", detail: "New lead submitted", tone: "from-amber-400 to-orange-500" },
  { icon: Bot, label: "AI step", detail: "Classify & summarise", tone: "from-violet-500 to-indigo-500" },
  { icon: Mail, label: "Action", detail: "Draft follow-up", tone: "from-sky-500 to-blue-600" },
];

/**
 * Abstract product illustration: an animated AI workflow card with floating
 * chips. Decorative only — hidden from assistive technology.
 */
export function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none lg:max-w-none">
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/25 via-accent/15 to-transparent blur-2xl" />

      <m.div
        initial={{ opacity: 0, y: 24, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.15 }}
        className="relative rounded-[1.75rem] border border-border bg-surface/85 p-5 shadow-lift backdrop-blur-xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <Workflow className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Lead follow-up</p>
              <p className="text-xs text-muted-foreground">Example workflow</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Running
          </span>
        </div>

        <div className="relative mt-6 space-y-3">
          {/* Connector line */}
          <svg className="absolute left-[1.35rem] top-6 h-[calc(100%-3rem)] w-1" preserveAspectRatio="none" viewBox="0 0 2 100">
            <m.line
              x1="1" y1="0" x2="1" y2="100"
              stroke="url(#hero-line)" strokeWidth="2" strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.5 }}
            />
            <defs>
              <linearGradient id="hero-line" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#f59e0b" />
                <stop offset="0.5" stopColor="#7c5cff" />
                <stop offset="1" stopColor="#2f6bff" />
              </linearGradient>
            </defs>
          </svg>
          {steps.map((step, i) => (
            <m.div
              key={step.label}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.45 + i * 0.18 }}
              className="relative flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.tone} text-white shadow-md`}>
                <step.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{step.label}</p>
                <p className="truncate text-sm font-medium text-foreground">{step.detail}</p>
              </div>
              <m.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 1.1 + i * 0.25 }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success"
              >
                <Check className="h-3.5 w-3.5" />
              </m.span>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 1.5 }}
          className="mt-5 rounded-2xl border border-primary/20 bg-primary-soft/70 p-4"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI summary
          </p>
          <div className="mt-2.5 space-y-2">
            <div className="h-2 w-full rounded-full bg-primary/20" />
            <div className="h-2 w-4/5 rounded-full bg-primary/15" />
            <div className="h-2 w-3/5 rounded-full bg-primary/10" />
          </div>
        </m.div>
      </m.div>

      {/* Floating chips */}
      <m.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ opacity: { delay: 1 }, scale: { delay: 1 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -left-4 -top-6 hidden rounded-2xl border border-border bg-surface/95 px-3.5 py-2.5 shadow-lift backdrop-blur sm:block lg:-left-8"
      >
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Time saved</p>
        <p className="text-sm font-semibold text-foreground">Fewer manual steps</p>
      </m.div>
      <m.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.2 }, scale: { delay: 1.2 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -right-3 bottom-24 hidden items-center gap-2 rounded-2xl border border-border bg-surface/95 px-3.5 py-2.5 shadow-lift backdrop-blur sm:flex lg:-right-8"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-white">
          <Check className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-foreground">Human review</span>
      </m.div>
    </div>
  );
}
