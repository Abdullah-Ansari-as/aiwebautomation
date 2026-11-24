import { Activity, ArrowRight, CircleCheck, CircleDashed, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { NoDatabaseNotice, Notice, StatTile, linkButton, linkButtonOutline } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { RevenueChart } from "@/components/admin/dashboard-charts";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { currentPeriod, periodLabel } from "@/lib/billing-options";
import { formatMoney, formatTotals } from "@/lib/money";
import { recentActivity } from "@/lib/server/activity";
import { getAnalyticsReport } from "@/lib/server/analytics";
import { countClientsByStatus, getMrr } from "@/lib/server/clients";
import { countNewLeadsSince } from "@/lib/server/dashboard";
import { isEmailConfigured } from "@/lib/server/email";
import { getCollected, getMonthlyRevenue, getReceivables } from "@/lib/server/invoices";
import { countLeadsByStatus } from "@/lib/server/leads";
import { countMessagesByStatus } from "@/lib/server/messages";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getBusinessSettings } from "@/lib/server/settings";
import { countSubscribers } from "@/lib/server/subscribers";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({ searchParams }: PageProps<"/admin">) {
  const session = await requireAdmin();
  const params = await searchParams;
  const forbidden = params.notice === "forbidden";

  if (!isDatabaseConfigured()) {
    return (
      <>
        <AdminPageHeader title="Overview" />
        <NoDatabaseNotice />
      </>
    );
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const settings = await getBusinessSettings();

  const [mrr, clientCounts, collected, receivables, revenue, leadCounts, newLeads, messageCounts, subscribers, traffic, activity] = await Promise.all([
    getMrr(),
    countClientsByStatus(),
    getCollected(monthStart, nextMonth),
    getReceivables(),
    getMonthlyRevenue(settings.defaultCurrency, 6),
    countLeadsByStatus(),
    countNewLeadsSince(weekAgo),
    countMessagesByStatus(),
    countSubscribers(),
    getAnalyticsReport(30),
    recentActivity(10),
  ]);

  const mrrTotals = mrr.map((m) => ({ currency: m.currency, amount: m.amount }));
  const overdueCount = receivables.overdue.reduce((s, r) => s + r.count, 0);
  const openPipeline = leadCounts.new + leadCounts.contacted + leadCounts.qualified + leadCounts.proposal_sent;
  const winRate = leadCounts.won + leadCounts.lost > 0 ? Math.round((leadCounts.won / (leadCounts.won + leadCounts.lost)) * 100) : null;
  const canWrite = hasRole(session.role, "admin");

  const checklist = [
    { done: true, label: "Database connected", href: "/admin/settings" },
    { done: isEmailConfigured(), label: "Email notifications set up (Resend)", href: "/admin/settings#system" },
    { done: Boolean(settings.address || settings.defaultPaymentLink), label: "Business & payment details added for invoices", href: "/admin/settings" },
    { done: clientCounts.active + clientCounts.paused + clientCounts.cancelled > 0, label: "First client added", href: "/admin/clients/new" },
    { done: collected.length > 0 || revenue.some((r) => r.amount > 0), label: "First payment recorded", href: "/admin/invoices" },
  ];
  const checklistDone = checklist.every((c) => c.done);

  return (
    <>
      <AdminPageHeader
        title={`Welcome, ${session.name}`}
        description={`${periodLabel(currentPeriod(now))} at a glance — recurring revenue, payments due and new business.`}
        action={
          canWrite ? (
            <>
              <Link href="/admin/clients/new" className={linkButtonOutline}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New client
              </Link>
              <Link href="/admin/invoices" className={linkButton}>
                Invoices <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </>
          ) : undefined
        }
      />
      {forbidden && <Notice tone="danger">You don&apos;t have permission to open that page. Ask the super admin if you need access.</Notice>}

      <section aria-label="Revenue" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Monthly recurring revenue" value={formatTotals(mrrTotals, settings.defaultCurrency)} hint={`${clientCounts.active} active client${clientCounts.active === 1 ? "" : "s"}`} href="/admin/clients" />
        <StatTile label="Collected this month" value={formatTotals(collected, settings.defaultCurrency)} hint={`${collected.reduce((s, c) => s + c.count, 0)} paid invoice(s)`} tone="success" href="/admin/invoices?status=paid" />
        <StatTile label="Outstanding" value={formatTotals(receivables.outstanding, settings.defaultCurrency)} hint={`${receivables.outstanding.reduce((s, c) => s + c.count, 0)} unpaid · ${receivables.drafts} draft(s)`} href="/admin/invoices?status=sent" />
        <StatTile
          label="Overdue"
          value={overdueCount > 0 ? formatTotals(receivables.overdue, settings.defaultCurrency) : formatMoney(0, settings.defaultCurrency)}
          hint={overdueCount > 0 ? `${overdueCount} invoice(s) past due — follow up` : "Nothing overdue"}
          tone={overdueCount > 0 ? "danger" : "default"}
          href="/admin/invoices?status=overdue"
        />
      </section>

      <section aria-label="Sales and website" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="New leads (7 days)" value={newLeads} hint={`${leadCounts.new} waiting for a reply`} href="/admin/leads?status=new" />
        <StatTile label="Open pipeline" value={openPipeline} hint={winRate === null ? "No closed deals yet" : `Win rate ${winRate}% (${leadCounts.won} won)`} href="/admin/leads" />
        <StatTile label="Unread messages" value={messageCounts.new} hint={`${subscribers.subscribed} newsletter subscriber(s)`} href="/admin/messages" />
        <StatTile label="Visitors (30 days)" value={traffic.totals.visitors.toLocaleString("en-US")} hint={`${traffic.totals.views.toLocaleString("en-US")} page views`} href="/admin/analytics" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <RevenueChart data={revenue} currency={settings.defaultCurrency} />
        {!checklistDone ? (
          <Card title="Getting started">
            <ul className="divide-y divide-border">
              {checklist.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-surface-muted/60">
                    {item.done ? <CircleCheck className="h-5 w-5 shrink-0 text-success" aria-hidden="true" /> : <CircleDashed className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                    <span className={item.done ? "text-muted-foreground line-through" : "font-medium text-foreground"}>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <ActivityCard activity={activity} />
        )}
      </div>

      {!checklistDone && (
        <div className="mt-6">
          <ActivityCard activity={activity} />
        </div>
      )}

    </>
  );
}

function ActivityCard({ activity }: { activity: Awaited<ReturnType<typeof recentActivity>> }) {
  return (
    <Card title="Recent activity">
      {activity.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Activity from the website and your team will appear here.</p>
      ) : (
        <ol className="px-5 py-2">
          {activity.map((a) => (
            <li key={a.id} className="flex gap-3 border-b border-border py-3 last:border-0">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-foreground">
                  {a.href ? (
                    <Link href={a.href} className="hover:text-primary">
                      {a.summary}
                    </Link>
                  ) : (
                    a.summary
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDateTime(a.at)} · {a.actor}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
