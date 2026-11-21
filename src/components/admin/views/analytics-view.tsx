"use client";

import { sampleArticleReads, sampleToolViews, sampleWeeklyViews } from "@/data/admin";
import { AdminPageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { SampleTag } from "../admin-ui";
import { BarList, ChartFrame, LineChart } from "../charts";

export function AnalyticsView() {
  const { tools, articles } = useAdmin();

  const weekly = sampleWeeklyViews.map((w) => ({ label: w.week, value: w.views }));
  const toolData = Object.entries(sampleToolViews)
    .map(([slug, value]) => ({ label: tools.find((t) => t.slug === slug)?.name ?? slug, value }))
    .sort((a, b) => b.value - a.value);
  const articleData = Object.entries(sampleArticleReads)
    .map(([slug, value]) => ({ label: articles.find((a) => a.slug === slug)?.title ?? slug, value }))
    .sort((a, b) => b.value - a.value);

  const total = weekly.reduce((s, w) => s + w.value, 0);
  const first = weekly[0].value;
  const last = weekly[weekly.length - 1].value;

  const tiles = [
    { label: "Page views (12 weeks)", value: total.toLocaleString("en-US") },
    { label: "Latest week", value: last.toLocaleString("en-US") },
    { label: "Change vs first week", value: `+${Math.round(((last - first) / first) * 100)}%` },
    { label: "Top tool page", value: toolData[0]?.label ?? "—" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Illustrative charts using sample numbers. Connect an analytics provider to show real traffic."
        action={<SampleTag />}
      />
      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft">
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{t.value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-6">
        <ChartFrame
          title="Weekly page views"
          subtitle="All pages, last 12 weeks"
          badge={<SampleTag />}
          table={{ columns: ["Week", "Views"], rows: weekly.map((w) => [w.label, w.value]) }}
        >
          <LineChart data={weekly} valueLabel="Views" />
        </ChartFrame>
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartFrame
            title="Tool popularity"
            subtitle="Views per tool detail page"
            badge={<SampleTag />}
            table={{ columns: ["Tool", "Views"], rows: toolData.map((d) => [d.label, d.value]) }}
          >
            <BarList data={toolData} valueLabel="Views" />
          </ChartFrame>
          <ChartFrame
            title="Article performance"
            subtitle="Reads per article"
            badge={<SampleTag />}
            table={{ columns: ["Article", "Reads"], rows: articleData.map((d) => [d.label, d.value]) }}
          >
            <BarList data={articleData} valueLabel="Reads" />
          </ChartFrame>
        </div>
      </div>
    </>
  );
}
