"use client";

import { Activity, ArrowRight, FileText, FolderTree, Inbox, Sparkles } from "lucide-react";
import Link from "next/link";
import { Counter } from "@/components/shared/counter";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { ToolLogo } from "@/components/tools/tool-logo";
import { sampleToolViews } from "@/data/admin";
import { formatDate } from "@/lib/utils";
import { AdminPageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { Card, SampleTag } from "../admin-ui";

export function OverviewView() {
  const { tools, articles, categories, submissions, activity } = useAdmin();
  const pending = submissions.filter((s) => s.status === "pending").length;
  const stats = [
    { label: "Total AI tools", value: tools.length, icon: Sparkles, href: "/admin/tools" },
    { label: "Articles & guides", value: articles.length, icon: FileText, href: "/admin/articles" },
    { label: "Categories", value: categories.length, icon: FolderTree, href: "/admin/categories" },
    { label: "Pending submissions", value: pending, icon: Inbox, href: "/admin/submissions" },
  ];
  const popular = tools
    .filter((t) => sampleToolViews[t.slug])
    .sort((a, b) => (sampleToolViews[b.slug] ?? 0) - (sampleToolViews[a.slug] ?? 0))
    .slice(0, 6);
  const maxViews = Math.max(1, ...popular.map((t) => sampleToolViews[t.slug] ?? 0));

  return (
    <>
      <AdminPageHeader title="Overview" description="A snapshot of directory content and recent activity." />
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <Link href={s.href} className="group block rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                <Counter value={s.value} duration={900} />
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Manage <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Popular tools" action={<SampleTag />}>
          <ul className="divide-y divide-border">
            {popular.map((tool, i) => {
              const views = sampleToolViews[tool.slug] ?? 0;
              return (
                <li key={tool.slug} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-4 text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                  <ToolLogo tool={tool} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{tool.name}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(views / maxViews) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">{views.toLocaleString("en-US")} views</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Recent activity">
          <ol className="space-y-0 px-5 py-2">
            {activity.slice(0, 7).map((a) => (
              <li key={a.id} className="flex gap-3 border-b border-border py-3 last:border-0">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
