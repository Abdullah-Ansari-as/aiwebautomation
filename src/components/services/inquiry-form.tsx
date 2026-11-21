"use client";

import { AnimatePresence, m } from "framer-motion";
import { CircleAlert, CircleCheck, Loader2, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { submitInquiry } from "@/lib/actions/inquiry";
import { track } from "@/lib/analytics";
import {
  BUDGET_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  LIMITS,
  SERVICE_OPTIONS,
  SPONSOR_OPTIONS,
  isOneOf,
  type InquiryFieldErrors,
  type InquiryKind,
  type InquiryState,
} from "@/lib/inquiry-options";
import { cn } from "@/lib/utils";

type Values = {
  fullName: string;
  email: string;
  company: string;
  website: string;
  category: string;
  budget: string;
  description: string;
  contactMethod: string;
  phone: string;
};

const FIELD_ORDER: (keyof InquiryFieldErrors)[] = ["fullName", "email", "company", "website", "category", "budget", "description", "contactMethod", "phone"];

const inputBase =
  "w-full rounded-xl border bg-surface px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:outline-none";

/**
 * Lead capture form for service quotes (`kind="service"`) and sponsor
 * inquiries (`kind="sponsor"`). Submits to the `submitInquiry` Server Action,
 * which validates, rate-limits, stores and notifies. `?service=` and
 * `?budget=` in the URL preselect options (used by CTAs across the site).
 */
export function InquiryForm({
  kind = "service",
  submitLabel = "Request a quote",
  whatsappHref,
}: {
  kind?: InquiryKind;
  submitLabel?: string;
  /** Optional WhatsApp link shown in the success state. */
  whatsappHref?: string | null;
}) {
  const id = useId();
  const mountedAt = useRef(0);
  const [state, formAction, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const [values, setValues] = useState<Values>({
    fullName: "",
    email: "",
    company: "",
    website: "",
    category: "",
    budget: "",
    description: "",
    contactMethod: "email",
    phone: "",
  });
  const [cleared, setCleared] = useState<Partial<Record<keyof Values, boolean>>>({});

  const categoryOptions = kind === "sponsor" ? SPONSOR_OPTIONS : SERVICE_OPTIONS;
  const fieldErrors: InquiryFieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errorFor = (name: keyof Values) => (cleared[name] ? undefined : fieldErrors[name]);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  // After a response: focus the first invalid field, or record the conversion.
  useEffect(() => {
    if (state.status === "error" && state.fieldErrors) {
      const first = FIELD_ORDER.find((f) => state.fieldErrors?.[f]);
      if (first) document.getElementById(`${id}-${first}`)?.focus();
    }
    if (state.status === "success") track("inquiry_submit", { kind, category: values.category, budget: values.budget });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to a new action result
  }, [state]);

  const set = (name: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setCleared((c) => ({ ...c, [name]: true }));
  };

  const submit = (formData: FormData) => {
    // Added at submit time so React's post-action form reset can't drop them.
    formData.set("startedAt", String(mountedAt.current || Date.now()));
    formData.set("sourcePath", window.location.pathname);
    setCleared({});
    formAction(formData);
  };

  const preset = (category: string | null, budget: string | null) => {
    setValues((v) => ({
      ...v,
      ...(category && isOneOf(categoryOptions, category) && { category }),
      ...(budget && isOneOf(BUDGET_OPTIONS, budget) && { budget }),
    }));
  };

  const needsPhone = values.contactMethod === "whatsapp" || values.contactMethod === "phone";

  if (state.status === "success") {
    return (
      <m.div
        role="status"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="rounded-[var(--radius-card)] border border-success/30 bg-success/10 p-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CircleCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-xl font-semibold text-foreground">Thanks — your request has been received</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          We&apos;ll review the details and reply using your preferred contact method.
          {state.reference !== "received" && (
            <>
              {" "}
              Your reference is <strong className="font-mono text-foreground">{state.reference}</strong>.
            </>
          )}
        </p>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp_click"
            data-track-location="inquiry-success"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Prefer chat? Message us on WhatsApp
          </a>
        )}
      </m.div>
    );
  }

  return (
    <form action={submit} noValidate className="relative space-y-5" aria-describedby={state.status === "error" ? `${id}-form-error` : undefined}>
      <Suspense fallback={null}>
        <SearchParamPreset onPreset={preset} />
      </Suspense>
      <input type="hidden" name="kind" value={kind} />
      {/* Honeypot: hidden from people and assistive tech; bots tend to fill every field. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-0 h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="hp_extra_info" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <AnimatePresence>
        {state.status === "error" && (
          <m.p
            id={`${id}-form-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-foreground"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
            <span>{state.message}</span>
          </m.p>
        )}
      </AnimatePresence>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id} name="fullName" label="Full name" required error={errorFor("fullName")} half>
          {(p) => <input {...p} type="text" autoComplete="name" maxLength={LIMITS.fullName} value={values.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Jane Doe" className={cn(inputBase, "h-11", p["aria-invalid"] ? "border-danger" : "border-border-strong")} />}
        </Field>
        <Field id={id} name="email" label="Business email" required error={errorFor("email")} half>
          {(p) => <input {...p} type="email" autoComplete="email" maxLength={LIMITS.email} value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com" className={cn(inputBase, "h-11", p["aria-invalid"] ? "border-danger" : "border-border-strong")} />}
        </Field>
        <Field id={id} name="company" label="Company name" required error={errorFor("company")} half>
          {(p) => <input {...p} type="text" autoComplete="organization" maxLength={LIMITS.company} value={values.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Ltd" className={cn(inputBase, "h-11", p["aria-invalid"] ? "border-danger" : "border-border-strong")} />}
        </Field>
        <Field id={id} name="website" label="Website URL" error={errorFor("website")} half>
          {(p) => <input {...p} type="url" inputMode="url" autoComplete="url" maxLength={LIMITS.website} value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="https://example.com" className={cn(inputBase, "h-11", p["aria-invalid"] ? "border-danger" : "border-border-strong")} />}
        </Field>
        <Field id={id} name="category" label={kind === "sponsor" ? "Sponsorship option" : "Service category"} required error={errorFor("category")} half>
          {(p) => (
            <select {...p} value={values.category} onChange={(e) => set("category", e.target.value)} className={cn(inputBase, "h-11", p["aria-invalid"] ? "border-danger" : "border-border-strong")}>
              <option value="">Select…</option>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id={id} name="budget" label="Budget range (USD)" required error={errorFor("budget")} half>
          {(p) => (
            <select {...p} value={values.budget} onChange={(e) => set("budget", e.target.value)} className={cn(inputBase, "h-11", p["aria-invalid"] ? "border-danger" : "border-border-strong")}>
              <option value="">Select…</option>
              {BUDGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          id={id}
          name="description"
          label={kind === "sponsor" ? "What would you like to promote?" : "Project description"}
          required
          error={errorFor("description")}
          hint={kind === "sponsor" ? "Your product, audience and timing." : "Which tools you use today, what you want automated and any deadline."}
        >
          {(p) => (
            <textarea
              {...p}
              rows={6}
              maxLength={LIMITS.description}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={kind === "sponsor" ? "Tell us about your product and the placement you have in mind." : "e.g. When a lead fills in our website form, add it to HubSpot, notify sales in Slack and send a follow-up email."}
              className={cn(inputBase, "py-3 leading-relaxed", p["aria-invalid"] ? "border-danger" : "border-border-strong")}
            />
          )}
        </Field>

        <fieldset className="sm:col-span-2" aria-describedby={errorFor("contactMethod") ? `${id}-contactMethod-error` : undefined}>
          <legend className="mb-1.5 block text-sm font-medium text-foreground">
            Preferred contact method<span className="text-danger"> *</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {CONTACT_METHOD_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/15",
                  values.contactMethod === o.value ? "border-primary bg-primary-soft text-primary" : "border-border-strong bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                <input
                  id={o.value === "email" ? `${id}-contactMethod` : undefined}
                  type="radio"
                  name="contactMethod"
                  value={o.value}
                  checked={values.contactMethod === o.value}
                  onChange={(e) => set("contactMethod", e.target.value)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
          {errorFor("contactMethod") && (
            <p id={`${id}-contactMethod-error`} role="alert" className="mt-1.5 text-sm text-danger">
              {errorFor("contactMethod")}
            </p>
          )}
        </fieldset>

        {(needsPhone || values.phone) && (
          <Field id={id} name="phone" label="Phone / WhatsApp number" required={needsPhone} error={errorFor("phone")} hint="Include your country code, e.g. +44 7700 900123.">
            {(p) => <input {...p} type="tel" autoComplete="tel" maxLength={LIMITS.phone} value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 123 4567" className={cn(inputBase, "h-11", p["aria-invalid"] ? "border-danger" : "border-border-strong")} />}
          </Field>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted-foreground">
          We only use these details to reply to your request. See our{" "}
          <Link href="/privacy-policy" className="text-primary hover:underline">
            privacy policy
          </Link>
          .
        </p>
        <m.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgb(109_74_255/0.7)] transition-colors hover:bg-primary-hover disabled:opacity-70 dark:text-primary-foreground"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          {pending ? "Sending…" : submitLabel}
        </m.button>
      </div>
    </form>
  );
}

type FieldControlProps = {
  id: string;
  name: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
};

function Field({
  id,
  name,
  label,
  required,
  error,
  hint,
  half,
  children,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  half?: boolean;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const fieldId = `${id}-${name}`;
  const describedBy = [error ? `${fieldId}-error` : "", hint ? `${fieldId}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={half ? "" : "sm:col-span-2"}>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-danger"> *</span> : <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {children({ id: fieldId, name, "aria-invalid": Boolean(error), "aria-describedby": describedBy, "aria-required": required || undefined })}
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Reads `?service=` / `?budget=` so CTAs elsewhere can preselect options. */
function SearchParamPreset({ onPreset }: { onPreset: (category: string | null, budget: string | null) => void }) {
  const params = useSearchParams();
  const service = params.get("service") ?? params.get("option");
  const budget = params.get("budget");
  useEffect(() => {
    if (service || budget) onPreset(service, budget);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the URL values change
  }, [service, budget]);
  return null;
}
