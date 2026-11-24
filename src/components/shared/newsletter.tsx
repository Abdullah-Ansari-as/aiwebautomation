"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, CircleCheck, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { subscribeNewsletter } from "@/lib/actions/public-forms";
import type { PublicFormState } from "@/lib/actions/types";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Newsletter sign-up. Saves the subscriber in MongoDB (with explicit consent)
 * and, when email is configured, sends a welcome email with an unsubscribe link.
 */
export function Newsletter({ variant = "section" }: { variant?: "section" | "inline" }) {
  const id = useId();
  const mountedAt = useRef(0);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [clientError, setClientError] = useState("");
  const [state, formAction, pending] = useActionState<PublicFormState, FormData>(subscribeNewsletter, { status: "idle" });
  const done = state.status === "success";

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status === "success") track("newsletter_signup", { variant });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to a new action result
  }, [state]);

  const submit = (formData: FormData) => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setClientError("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      setClientError("Please tick the box to confirm you'd like the newsletter.");
      return;
    }
    setClientError("");
    formData.set("startedAt", String(mountedAt.current || Date.now()));
    formData.set("sourcePath", window.location.pathname);
    formAction(formData);
  };

  const error = clientError || (state.status === "error" ? state.message : "");

  const form = (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <m.div
          key="success"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          className="rounded-2xl border border-success/30 bg-success/10 p-5 text-left"
        >
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <CircleCheck className="h-5 w-5 text-success" aria-hidden="true" /> You&apos;re subscribed — thank you!
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Look out for the next weekly brief. Every email includes a one-click unsubscribe link.</p>
        </m.div>
      ) : (
        <m.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} action={submit} noValidate className="relative">
          <div aria-hidden="true" className="absolute -left-[10000px] top-0 h-px w-px overflow-hidden">
            <label>
              Leave this field empty
              <input type="text" name="hp_extra_info" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor={`${id}-email`} className="sr-only">
                Email address
              </label>
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id={`${id}-email`}
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                maxLength={254}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (clientError) setClientError("");
                }}
                placeholder="you@company.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                className={cn(
                  "h-12 w-full rounded-xl border bg-surface pl-10 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:outline-none",
                  error ? "border-danger" : "border-border-strong",
                )}
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-70 dark:text-primary-foreground"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  Subscribe <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
          <label className="mt-3 flex items-start gap-2 text-left text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="consent"
              value="yes"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (clientError) setClientError("");
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
            />
            <span>
              Yes, send me the weekly brief. Unsubscribe any time. See our{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {error && (
            <p id={`${id}-error`} role="alert" className="mt-2 text-left text-sm text-danger">
              {error}
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
