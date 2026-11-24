import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { LinkTabs, NoDatabaseNotice, StatTile } from "@/components/admin/admin-kit";
import { RankedBars, TrafficChart } from "@/components/admin/dashboard-charts";
import { requireAdmin } from "@/lib/auth/session";
import { getAnalyticsReport } from "@/lib/server/analytics";
import { isDatabaseConfigured } from "@/lib/server/mongodb";

export const metadata: Metadata = { title: "Analytics" };

const EVENT_LABELS: Record<string, string> = {
  services_page_view: "Services page views",
  consultation_click: "Quote / consultation clicks",
  inquiry_submit: "Quote requests sent",
  whatsapp_click: "WhatsApp clicks",
  affiliate_click: "Affiliate link clicks",
  newsletter_signup: "Newsletter sign-ups",
  booking_click: "Booking link clicks",
};

function change(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "New this period" : "No data yet";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs previous period`;
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const params = await searchParams;
  const range = params.range === "7" ? 7 : params.range === "90" ? 90 : 30;
  const report = await getAnalyticsReport(range);
  const inquiries = report.events.find((e) => e.key === "inquiry_submit")?.count ?? 0;
  const conversion = report.totals.visitors > 0 ? ((inquiries / report.totals.visitors) * 100).toFixed(1) : "0.0";

  return (
    <>
      <AdminPageHeader title="Analytics" description="Built-in, cookieless analytics: no cookie banner needed, no personal data stored." />
      <LinkTabs
        label="Date range"
        active={String(range)}
        tabs={[
          { value: "7", label: "7 days", href: "/admin/analytics?range=7" },
          { value: "30", label: "30 days", href: "/admin/analytics" },
          { value: "90", label: "90 days", href: "/admin/analytics?range=90" },
        ]}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Unique visitors" value={report.totals.visitors.toLocaleString("en-US")} hint={change(report.totals.visitors, report.totals.previousVisitors)} />
        <StatTile label="Page views" value={report.totals.views.toLocaleString("en-US")} hint={change(report.totals.views, report.totals.previousViews)} />
        <StatTile label="Quote requests" value={inquiries.toLocaleString("en-US")} hint="From the Services & Advertise forms" />
        <StatTile label="Visitor → quote rate" value={`${conversion}%`} hint="Quote requests ÷ unique visitors" />
      </div>
      <div className="space-y-6">
        <TrafficChart days={report.days} />
        <div className="grid gap-6 xl:grid-cols-2">
          <RankedBars title="Top pages" subtitle={`Last ${range} days`} rows={report.topPages.map((p) => ({ label: p.key, value: p.count }))} valueLabel="Views" columns={["Page", "Views"]} />
          <RankedBars title="Traffic sources" subtitle="Referring websites" rows={report.referrers.map((r) => ({ label: r.key, value: r.count }))} valueLabel="Visits" columns={["Source", "Visits"]} />
        </div>
        <RankedBars title="Conversions" subtitle="Clicks and form submissions" rows={report.events.map((e) => ({ label: EVENT_LABELS[e.key] ?? e.key, value: e.count }))} valueLabel="Events" columns={["Event", "Count"]} />
      </div>
    </>
  );
}
