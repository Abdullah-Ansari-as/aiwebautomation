import { Database } from "lucide-react";
import { Badge } from "@/components/shared/badge";
import { LEAD_STATUSES, optionLabel, type LeadStatus } from "@/lib/inquiry-options";

const statusTone: Record<LeadStatus, "primary" | "accent" | "warning" | "success" | "danger" | "neutral"> = {
  new: "primary",
  contacted: "accent",
  qualified: "warning",
  proposal_sent: "accent",
  won: "success",
  lost: "neutral",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={statusTone[status]}>{optionLabel(LEAD_STATUSES, status)}</Badge>;
}

/** Shown when MONGODB_URI is missing, instead of an error page. */
export function DatabaseSetupNotice() {
  return (
    <div className="rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 p-6 text-sm leading-relaxed text-foreground">
      <p className="flex items-center gap-2 font-semibold">
        <Database className="h-4 w-4 text-warning" aria-hidden="true" /> Database not configured
      </p>
      <p className="mt-2 text-muted-foreground">
        Set <code className="font-mono text-foreground">MONGODB_URI</code> (and optionally{" "}
        <code className="font-mono text-foreground">MONGODB_DB_NAME</code>), run <code className="font-mono text-foreground">npm run db:setup</code>, then
        restart the app. Inquiries can&apos;t be stored until this is done.
      </p>
    </div>
  );
}
