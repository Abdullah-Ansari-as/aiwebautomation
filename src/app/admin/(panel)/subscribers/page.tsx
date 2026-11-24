import { Download } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { EmptyBlock, LinkTabs, NoDatabaseNotice, StatTile, linkButtonOutline } from "@/components/admin/admin-kit";
import { Badge } from "@/components/shared/badge";
import { ActionButton } from "@/components/admin/controls";
import { deleteSubscriberAction } from "@/lib/actions/inbox";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { countSubscribers, listSubscribers } from "@/lib/server/subscribers";
import { formatDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Subscribers" };

export default async function SubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  const session = await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const params = await searchParams;
  const status = params.status === "unsubscribed" ? "unsubscribed" : "subscribed";
  const [subscribers, counts] = await Promise.all([listSubscribers(status), countSubscribers()]);
  const canWrite = hasRole(session.role, "admin");

  return (
    <>
      <AdminPageHeader
        title="Newsletter subscribers"
        description="People who signed up for the weekly brief, with consent. Export them to your email tool (e.g. Resend, Brevo, Mailchimp)."
        action={
          <a href="/admin/subscribers/export" className={linkButtonOutline} download>
            <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
          </a>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Active subscribers" value={counts.subscribed} />
        <StatTile label="New in the last 30 days" value={counts.last30Days} />
        <StatTile label="Unsubscribed" value={counts.unsubscribed} />
      </div>
      <LinkTabs
        label="Filter subscribers"
        active={status}
        tabs={[
          { value: "subscribed", label: "Subscribed", href: "/admin/subscribers", count: counts.subscribed },
          { value: "unsubscribed", label: "Unsubscribed", href: "/admin/subscribers?status=unsubscribed", count: counts.unsubscribed },
        ]}
      />
      {subscribers.length === 0 ? (
        <EmptyBlock title="No subscribers here yet">The newsletter form on the homepage, blog and guides adds people here.</EmptyBlock>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft">
          {subscribers.map((s) => (
            <li key={s.id} className="grid gap-2 border-b border-border px-5 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_8rem] sm:items-center">
              <p className="truncate text-sm font-medium text-foreground">{s.email}</p>
              <p className="text-sm text-muted-foreground">{formatDay(s.createdAt)}</p>
              <p className="truncate text-xs text-muted-foreground">{s.source ?? "—"}</p>
              <div className="flex items-center gap-2">
                {s.status === "unsubscribed" && <Badge>Unsubscribed</Badge>}
                {canWrite && (
                  <ActionButton action={deleteSubscriberAction.bind(null, s.id)} variant="danger" confirm={`Permanently delete ${s.email}? Use this for data-removal requests.`} className="w-24">
                    Delete
                  </ActionButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
