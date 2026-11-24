import { Database, Inbox, ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/shared/badge";
import type { ClientStatus, InvoiceDisplayStatus } from "@/lib/billing-options";
import type { MessageStatus, SubmissionStatus } from "@/lib/form-options";
import { cn } from "@/lib/utils";

/** Server-safe building blocks for admin pages. */

type Tone = "neutral" | "primary" | "accent" | "success" | "warning" | "danger";

const invoiceTone: Record<InvoiceDisplayStatus, Tone> = { draft: "neutral", sent: "accent", overdue: "danger", paid: "success", void: "neutral" };
const invoiceText: Record<InvoiceDisplayStatus, string> = { draft: "Draft", sent: "Sent", overdue: "Overdue", paid: "Paid", void: "Void" };
export function InvoiceStatusBadge({ status }: { status: InvoiceDisplayStatus }) {
  return <Badge tone={invoiceTone[status]}>{invoiceText[status]}</Badge>;
}

const clientTone: Record<ClientStatus, Tone> = { active: "success", paused: "warning", cancelled: "neutral" };
export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge tone={clientTone[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

const messageTone: Record<MessageStatus, Tone> = { new: "primary", read: "neutral", replied: "success", archived: "neutral" };
export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  return <Badge tone={messageTone[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

const submissionTone: Record<SubmissionStatus, Tone> = { pending: "warning", approved: "success", rejected: "neutral" };
export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge tone={submissionTone[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

export function StatTile({ label, value, hint, href, tone = "default" }: { label: string; value: ReactNode; hint?: ReactNode; href?: string; tone?: "default" | "danger" | "success" }) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums", tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-foreground")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const className = "block rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft";
  return href ? (
    <Link href={href} className={cn(className, "transition-all hover:-translate-y-0.5 hover:border-primary/40")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function EmptyBlock({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border p-12 text-center">
      <Inbox className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 font-medium text-foreground">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Link-based tabs (state lives in the URL, so it works without client JS). */
export function LinkTabs({ tabs, active, label }: { tabs: { value: string; label: string; href: string; count?: number }[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="mb-6 overflow-x-auto">
      <ul className="inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
        {tabs.map((tab) => {
          const current = tab.value === active;
          return (
            <li key={tab.value || "all"}>
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  current ? "bg-primary text-white dark:text-primary-foreground" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {tab.label}
                {tab.count !== undefined && <span className="opacity-75"> ({tab.count})</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NoDatabaseNotice() {
  return (
    <div className="rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 p-6 text-sm leading-relaxed text-foreground">
      <p className="flex items-center gap-2 font-semibold">
        <Database className="h-4 w-4 text-warning" aria-hidden="true" /> Database not configured
      </p>
      <p className="mt-2 text-muted-foreground">
        Set <code className="font-mono text-foreground">MONGODB_URI</code> (local MongoDB or a MongoDB Atlas connection string), run{" "}
        <code className="font-mono text-foreground">npm run db:setup</code>, then restart the app.
      </p>
    </div>
  );
}

export function Notice({ tone = "warning", children }: { tone?: "warning" | "danger" | "success"; children: ReactNode }) {
  const styles = { warning: "border-warning/30 bg-warning/10", danger: "border-danger/30 bg-danger/10", success: "border-success/30 bg-success/10" };
  return (
    <p className={cn("mb-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm text-foreground", styles[tone])}>
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export const linkButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover dark:text-primary-foreground";
export const linkButtonOutline =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary";

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}
