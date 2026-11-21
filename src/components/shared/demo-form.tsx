"use client";

import { AnimatePresence, m } from "framer-motion";
import { CircleCheck, Info, Loader2, Send } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DemoField {
  name: string;
  label: string;
  type?: "text" | "email" | "url" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  autoComplete?: string;
  /** Minimum length for text inputs. */
  minLength?: number;
  half?: boolean;
  hint?: string;
}

type Values = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(fields: DemoField[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = (values[field.name] ?? "").trim();
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (!value) continue;
    if (field.type === "email" && !EMAIL.test(value)) errors[field.name] = "Enter a valid email address.";
    if (field.type === "url") {
      try {
        const url = new URL(value);
        if (!/^https?:$/.test(url.protocol)) throw new Error("protocol");
      } catch {
        errors[field.name] = "Enter a full URL starting with https://";
      }
    }
    if (field.minLength && value.length < field.minLength) errors[field.name] = `Please write at least ${field.minLength} characters.`;
  }
  return errors;
}

/**
 * Accessible form with client-side validation and an explicit demo submission
 * state. Nothing is transmitted until a backend endpoint is connected.
 */
export function DemoForm({
  fields,
  submitLabel,
  successTitle,
  demoNote,
  footer,
}: {
  fields: DemoField[];
  submitLabel: string;
  successTitle: string;
  demoNote: ReactNode;
  footer?: ReactNode;
}) {
  const id = useId();
  const empty = Object.fromEntries(fields.map((f) => [f.name, f.type === "select" ? "" : ""]));
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(fields, values);
    setErrors(found);
    const firstError = fields.find((f) => found[f.name]);
    if (firstError) {
      document.getElementById(`${id}-${firstError.name}`)?.focus();
      return;
    }
    setStatus("submitting");
    window.setTimeout(() => setStatus("done"), 800);
  };

  const base =
    "w-full rounded-xl border bg-surface px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:outline-none";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "done" ? (
        <m.div
          key="done"
          role="status"
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-[var(--radius-card)] border border-success/30 bg-success/10 p-8 text-center"
        >
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 18, delay: 0.1 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"
          >
            <CircleCheck className="h-7 w-7" aria-hidden="true" />
          </m.span>
          <h3 className="mt-5 text-xl font-semibold text-foreground">{successTitle}</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{demoNote}</p>
          <button
            type="button"
            onClick={() => {
              setValues(empty);
              setStatus("idle");
            }}
            className="mt-6 text-sm font-medium text-primary hover:underline"
          >
            Start over
          </button>
        </m.div>
      ) : (
        <m.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} noValidate className="space-y-5">
          <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <span>
              <strong>Demo form:</strong> submissions are validated but not sent or stored until our backend is connected.
            </span>
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((field) => {
              const fieldId = `${id}-${field.name}`;
              const error = errors[field.name];
              const describedBy = [error ? `${fieldId}-error` : "", field.hint ? `${fieldId}-hint` : ""].filter(Boolean).join(" ") || undefined;
              const common = {
                id: fieldId,
                name: field.name,
                value: values[field.name],
                "aria-invalid": Boolean(error),
                "aria-describedby": describedBy,
                "aria-required": field.required,
              };
              return (
                <div key={field.name} className={field.half ? "" : "sm:col-span-2"}>
                  <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-foreground">
                    {field.label}
                    {field.required ? <span className="text-danger"> *</span> : <span className="font-normal text-muted-foreground"> (optional)</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      {...common}
                      rows={6}
                      placeholder={field.placeholder}
                      onChange={(e) => set(field.name, e.target.value)}
                      className={cn(base, "py-3 leading-relaxed", error ? "border-danger" : "border-border-strong")}
                    />
                  ) : field.type === "select" ? (
                    <select {...common} onChange={(e) => set(field.name, e.target.value)} className={cn(base, "h-11", error ? "border-danger" : "border-border-strong")}>
                      <option value="">Select…</option>
                      {field.options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...common}
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      onChange={(e) => set(field.name, e.target.value)}
                      className={cn(base, "h-11", error ? "border-danger" : "border-border-strong")}
                    />
                  )}
                  {field.hint && !error && (
                    <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-muted-foreground">
                      {field.hint}
                    </p>
                  )}
                  <AnimatePresence>
                    {error && (
                      <m.p
                        id={`${fieldId}-error`}
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-1.5 text-sm text-danger"
                      >
                        {error}
                      </m.p>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {footer && <div className="text-xs text-muted-foreground">{footer}</div>}
            <m.button
              type="submit"
              disabled={status === "submitting"}
              whileTap={{ scale: 0.97 }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgb(109_74_255/0.7)] transition-colors hover:bg-primary-hover disabled:opacity-70 dark:text-primary-foreground"
            >
              {status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {status === "submitting" ? "Sending…" : submitLabel}
            </m.button>
          </div>
        </m.form>
      )}
    </AnimatePresence>
  );
}
