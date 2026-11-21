"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check, ExternalLink, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { Badge, PricingBadge } from "@/components/shared/badge";
import { cn, formatDate } from "@/lib/utils";
import type { ToolSubmission } from "@/data/admin";
import { AdminPageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { SampleTag } from "../admin-ui";

const tabs: { id: ToolSubmission["status"]; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export function SubmissionsView() {
  const { submissions, categories, setSubmissionStatus } = useAdmin();
  const [tab, setTab] = useState<ToolSubmission["status"]>("pending");
  const rows = submissions.filter((s) => s.status === tab);

  return (
    <>
      <AdminPageHeader title="Submissions" description="Review AI tools suggested through the public submission form." action={<SampleTag />} />
      <div role="tablist" aria-label="Submission status" className="mb-6 inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
        {tabs.map((t) => {
          const count = submissions.filter((s) => s.status === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn("relative rounded-lg px-4 py-2 text-sm font-medium transition-colors", tab === t.id ? "text-white dark:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {tab === t.id && <m.span layoutId="submission-tab" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              <span className="relative">
                {t.label} ({count})
              </span>
            </button>
          );
        })}
      </div>

      <ul className="space-y-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((s) => (
            <m.li
              key={s.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{s.toolName}</h2>
                    <PricingBadge pricing={s.pricing} />
                    <Badge>{categories.find((c) => c.slug === s.category)?.name ?? s.category}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>From {s.submittedBy}</span>
                    <span>Submitted {formatDate(s.submittedAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" aria-hidden="true" /> {s.website}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {s.status === "pending" ? (
                    <>
                      <button type="button" onClick={() => setSubmissionStatus(s.id, "rejected")} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-all hover:border-danger/40 hover:text-danger active:scale-95">
                        <X className="h-4 w-4" aria-hidden="true" /> Reject
                      </button>
                      <button type="button" onClick={() => setSubmissionStatus(s.id, "approved")} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-success px-4 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 dark:text-[#04120c]">
                        <Check className="h-4 w-4" aria-hidden="true" /> Approve
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setSubmissionStatus(s.id, "pending")} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-all hover:border-primary/40 active:scale-95">
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> Move to pending
                    </button>
                  )}
                </div>
              </div>
            </m.li>
          ))}
        </AnimatePresence>
        {rows.length === 0 && <li className="rounded-[var(--radius-card)] border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No {tab} submissions.</li>}
      </ul>
    </>
  );
}
