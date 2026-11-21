"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, CircleCheck, Info, Loader2, Mail } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "submitting" | "demo-success";

/**
 * Newsletter sign-up UI. No email provider is connected yet, so submission
 * only validates the address and shows an explicit demo message — nothing is
 * sent or stored.
 */
export function Newsletter({ variant = "section" }: { variant?: "section" | "inline" }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setStatus("submitting");
    // Simulated latency so the interaction feels real; no network request is made.
    window.setTimeout(() => setStatus("demo-success"), 700);
  };

  const form = (
    <AnimatePresence mode="wait" initial={false}>
      {status === "demo-success" ? (
        <m.div
          key="success"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          className="rounded-2xl border border-success/30 bg-success/10 p-5 text-left"
        >
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <CircleCheck className="h-5 w-5 text-success" aria-hidden="true" /> Thanks — that address looks good!
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong className="text-foreground">Demo mode:</strong> the newsletter service isn&apos;t connected yet, so your email
            was <strong className="text-foreground">not</strong> sent or stored.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setEmail("");
            }}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Try another address
          </button>
        </m.div>
      ) : (
        <m.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} noValidate>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor={`${id}-email`} className="sr-only">
                Email address
              </label>
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="you@company.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : `${id}-note`}
                className={cn(
                  "h-12 w-full rounded-xl border bg-surface pl-10 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:outline-none",
                  error ? "border-danger" : "border-border-strong",
                )}
              />
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-70 dark:text-primary-foreground"
            >
              {status === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  Subscribe <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
          {error ? (
            <p id={`${id}-error`} role="alert" className="mt-2 text-left text-sm text-danger">
              {error}
            </p>
          ) : (
            <p id={`${id}-note`} className="mt-3 flex items-center gap-1.5 text-left text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" aria-hidden="true" /> Preview only — subscriptions aren&apos;t saved until our email service is connected.
            </p>
          )}
        </m.form>
      )}
    </AnimatePresence>
  );

  if (variant === "inline") {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Get the weekly AI & automation brief</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">New tools, guides and workflows — one concise email a week.</p>
        <div className="mt-4">{form}</div>
      </div>
    );
  }

  return (
    <section className="container-site py-20 sm:py-24" aria-labelledby={`${id}-heading`}>
      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-surface px-6 py-14 text-center shadow-lift sm:px-12"
      >
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute inset-0 animate-gradient bg-brand-gradient opacity-[0.08] dark:opacity-[0.16]" />
          <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Newsletter</p>
        <h2 id={`${id}-heading`} className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
          Stay ahead of AI and automation
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          A concise weekly brief with new tools worth trying, practical workflows and the technology shifts that matter.
        </p>
        <div className="mx-auto mt-8 max-w-lg">{form}</div>
      </m.div>
    </section>
  );
}
