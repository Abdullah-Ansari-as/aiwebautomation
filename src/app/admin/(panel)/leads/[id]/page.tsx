import { ArrowLeft, Briefcase, ExternalLink, Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { linkButton } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { LeadNoteForm, LeadStatusForm } from "@/components/admin/lead-forms";
import { DatabaseSetupNotice, LeadStatusBadge } from "@/components/admin/lead-ui";
import { Skeleton } from "@/components/shared/skeleton";
import { BUDGET_OPTIONS, CONTACT_METHOD_OPTIONS, categoryLabel, optionLabel } from "@/lib/inquiry-options";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { findClientByLead } from "@/lib/server/clients";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getLead, getLeadNotes } from "@/lib/server/leads";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Lead details" };

/**
 * Admin-only page keyed by a database id: it can't be prerendered, so let
 * navigations block on the server instead of requiring a static shell.
 */
export const instant = false;

const notificationLabel = {
  pending: "Pending",
  sending: "Sending…",
  sent: "Sent",
  failed: "Failed — check server logs",
  not_configured: "Not sent — email not configured",
} as const;

export default function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  return (
    <>
      <Link href="/admin/leads" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All leads
      </Link>
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]" aria-busy="true" aria-label="Loading lead">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <LeadDetail params={params} />
      </Suspense>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

async function LeadDetail({ params }: { params: PageProps<"/admin/leads/[id]">["params"] }) {
  await connection();
  if (!isDatabaseConfigured()) return <DatabaseSetupNotice />;
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();
  const session = await requireAdmin();
  const [notes, client] = await Promise.all([getLeadNotes(lead.id), findClientByLead(lead.id)]);
  const canWrite = hasRole(session.role, "admin");
  const phoneDigits = lead.phone?.replace(/\D/g, "");

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{lead.reference}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{lead.fullName}</h1>
          <p className="mt-1 text-muted-foreground">
            {lead.company} · {lead.kind === "sponsor" ? "Sponsor inquiry" : "Service inquiry"}
          </p>
        </div>
        <LeadStatusBadge status={lead.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Card title="Project requirements">
            <div className="space-y-5 p-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Row label={lead.kind === "sponsor" ? "Sponsorship option" : "Service"}>{categoryLabel(lead.category)}</Row>
                <Row label="Budget">{optionLabel(BUDGET_OPTIONS, lead.budget)}</Row>
              </dl>
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-1.5 whitespace-pre-wrap break-words rounded-xl border border-border bg-surface-muted/40 p-4 text-sm leading-relaxed text-foreground">{lead.description}</p>
              </div>
            </div>
          </Card>

          <Card title={`Internal notes (${notes.length})`}>
            <div className="space-y-5 p-5">
              {canWrite && <LeadNoteForm leadId={lead.id} />}
              {notes.length > 0 && (
                <ol className="space-y-3 border-t border-border pt-5">
                  {notes.map((note) => (
                    <li key={note.id} className="rounded-xl border border-border bg-surface-muted/40 p-4">
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{note.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {note.author} · <time dateTime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {canWrite && (
            <Card title="Status">
              <div className="p-5">
                <LeadStatusForm leadId={lead.id} status={lead.status} />
              </div>
            </Card>
          )}

          <Card title="Client">
            <div className="space-y-3 p-5">
              {client ? (
                <Link href={`/admin/clients/${client.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  <Briefcase className="h-4 w-4" aria-hidden="true" /> {client.name} is a client
                </Link>
              ) : canWrite ? (
                <>
                  <p className="text-sm text-muted-foreground">Deal agreed? Turn this lead into a client to start invoicing (monthly or one-off).</p>
                  <Link href={`/admin/clients/new?lead=${lead.id}`} className={`${linkButton} w-full`}>
                    <Briefcase className="h-4 w-4" aria-hidden="true" /> Convert to client
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not a client yet.</p>
              )}
            </div>
          </Card>

          <Card title="Customer details">
            <dl className="space-y-4 p-5">
              <Row label="Name">{lead.fullName}</Row>
              <Row label="Email">
                <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Re: your inquiry ${lead.reference}`)}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {lead.email}
                </a>
              </Row>
              <Row label="Company">{lead.company}</Row>
              <Row label="Website">
                {lead.website ? (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Preferred contact">{optionLabel(CONTACT_METHOD_OPTIONS, lead.contactMethod)}</Row>
              <Row label="Phone">
                {lead.phone ? (
                  <span className="flex flex-wrap gap-x-4 gap-y-1">
                    <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {lead.phone}
                    </a>
                    {phoneDigits && (
                      <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
                      </a>
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </Row>
            </dl>
          </Card>

          <Card title="Tracking">
            <dl className="space-y-4 p-5">
              <Row label="Received">
                <time dateTime={lead.createdAt}>{formatDateTime(lead.createdAt)}</time>
              </Row>
              <Row label="Last updated">
                <time dateTime={lead.updatedAt}>{formatDateTime(lead.updatedAt)}</time>
              </Row>
              <Row label="Sent from page">{lead.sourcePath ?? "—"}</Row>
              <Row label="Email notification">{notificationLabel[lead.notificationStatus]}</Row>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
