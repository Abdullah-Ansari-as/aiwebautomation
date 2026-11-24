"use client";

import { periodLabel } from "@/lib/billing-options";
import { formatMoney, type Currency } from "@/lib/money";
import { BarList, ChartFrame, LineChart } from "./charts";

/** Client wrappers so server pages can pass plain data (formatters can't cross the boundary). */

export function RevenueChart({ data, currency }: { data: { period: string; amount: number }[]; currency: Currency }) {
  const points = data.map((d) => ({ label: periodLabel(d.period).replace(/ \d{4}$/, ""), value: d.amount / 100 }));
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <ChartFrame
      title="Revenue collected"
      subtitle={`Paid invoices in ${currency}, last ${data.length} months · ${formatMoney(total, currency)} total`}
      table={{ columns: ["Month", `Revenue (${currency})`], rows: data.map((d) => [periodLabel(d.period), Math.round(d.amount / 100)]) }}
    >
      <LineChart data={points} valueLabel="collected" tooltipPrefix="" formatValue={(n) => formatMoney(Math.round(n * 100), currency)} axisFormat={(n) => formatMoney(Math.round(n * 100), currency, { compact: true })} />
    </ChartFrame>
  );
}

export function TrafficChart({ days }: { days: { date: string; views: number; visitors: number }[] }) {
  const label = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return (
    <ChartFrame
      title="Page views"
      subtitle={`All public pages, last ${days.length} days`}
      table={{ columns: ["Day", "Views"], rows: days.map((d) => [label(d.date), d.views]) }}
    >
      <LineChart data={days.map((d) => ({ label: label(d.date), value: d.views }))} valueLabel="Views" tooltipPrefix="" />
    </ChartFrame>
  );
}

export function RankedBars({ title, subtitle, rows, valueLabel, columns }: { title: string; subtitle?: string; rows: { label: string; value: number }[]; valueLabel: string; columns: [string, string] }) {
  return (
    <ChartFrame title={title} subtitle={subtitle} table={{ columns, rows: rows.map((r) => [r.label, r.value]) }}>
      {rows.length > 0 ? <BarList data={rows} valueLabel={valueLabel} /> : <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>}
    </ChartFrame>
  );
}
