import { ExternalLink, Mail } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { EmptyBlock, LinkTabs, NoDatabaseNotice, SubmissionStatusBadge } from "@/components/admin/admin-kit";
import { ActionButton } from "@/components/admin/controls";
import { ReviewForm } from "@/components/admin/review-form";
import { Badge } from "@/components/shared/badge";
import { toolCategories } from "@/data/categories";
import { deleteSubmissionAction } from "@/lib/actions/inbox";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { SUBMISSION_RELATIONSHIPS, SUBMISSION_STATUSES } from "@/lib/form-options";
import { isOneOf, optionLabel } from "@/lib/inquiry-options";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { countSubmissionsByStatus, listSubmissions } from "@/lib/server/submissions";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Tool submissions" };

export default async function SubmissionsPage({ searchParams }: PageProps<"/admin/submissions">) {
  const session = await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const params = await searchParams;
  const requested = typeof params.status === "string" ? params.status : "pending";
  const status = isOneOf(SUBMISSION_STATUSES, requested) ? requested : "pending";
  const [submissions, counts] = await Promise.all([listSubmissions(status), countSubmissionsByStatus()]);
  const canWrite = hasRole(session.role, "admin");

  return (
    <>
      <AdminPageHeader
        title="Tool submissions"
        description="AI tools suggested through the public form. Approving marks it as accepted — then add the listing to src/data/tools.ts and redeploy."
      />
      <LinkTabs label="Filter submissions" active={status} tabs={SUBMISSION_STATUSES.map((s) => ({ value: s.value, label: s.label, href: `/admin/submissions?status=${s.value}`, count: counts[s.value] }))} />
      {submissions.length === 0 ? (
        <EmptyBlock title={`No ${status} submissions`}>Suggestions from /submit-tool appear here.</EmptyBlock>
      ) : (
        <ul className="space-y-4">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{s.toolName}</h2>
                    <SubmissionStatusBadge status={s.status} />
                    <Badge>{toolCategories.find((c) => c.slug === s.category)?.name ?? s.category}</Badge>
                    <Badge tone="accent">{s.pricing}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{s.description}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <a href={s.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" aria-hidden="true" /> {s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                    <a href={`mailto:${s.email}?subject=${encodeURIComponent(`Your ${s.toolName} submission`)}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Mail className="h-3 w-3" aria-hidden="true" /> {s.email}
                    </a>
                    {s.relationship && <span>{optionLabel(SUBMISSION_RELATIONSHIPS, s.relationship)}</span>}
                    <span>{formatDateTime(s.createdAt)}</span>
                    <span className="font-mono">{s.reference}</span>
                  </p>
                  {s.reviewedBy && <p className="mt-2 text-xs text-muted-foreground">Reviewed by {s.reviewedBy}</p>}
                </div>
                {canWrite && (
                  <div className="w-full shrink-0 space-y-3 lg:w-80">
                    <ReviewForm id={s.id} status={s.status} note={s.reviewNote} />
                    <ActionButton action={deleteSubmissionAction.bind(null, s.id)} variant="danger" confirm={`Delete the ${s.toolName} submission?`}>
                      Delete
                    </ActionButton>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
