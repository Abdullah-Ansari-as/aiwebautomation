import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { LinkTabs, Notice } from "@/components/admin/admin-kit";
import { Badge, PricingBadge } from "@/components/shared/badge";
import { articles } from "@/data/articles";
import { getArticleCategory, getGuideCategory, getToolCategory, toolCategories } from "@/data/categories";
import { guides } from "@/data/guides";
import { tools } from "@/data/tools";
import { utilities } from "@/data/utilities";
import { requireAdmin } from "@/lib/auth/session";
import { getViewsByPrefix } from "@/lib/server/analytics";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Content" };

const TABS = [
  { value: "tools", label: "AI tools" },
  { value: "articles", label: "Articles & guides" },
  { value: "categories", label: "Categories" },
  { value: "utilities", label: "Free tools" },
] as const;

async function views(prefix: string): Promise<Map<string, number>> {
  if (!isDatabaseConfigured()) return new Map();
  return getViewsByPrefix(prefix).catch(() => new Map<string, number>());
}

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  await requireAdmin();
  const params = await searchParams;
  const tab = TABS.find((t) => t.value === params.tab)?.value ?? "tools";

  return (
    <>
      <AdminPageHeader title="Content library" description="Everything published on the website, with page views from the last 30 days." />
      <Notice>
        Content lives in version-controlled files (<code className="font-mono">src/data/</code>) and is published with each deploy, which keeps the site fast and safe. Edit a file and
        redeploy to change it; add cover images with <code className="font-mono">npm run covers</code>.
      </Notice>
      <LinkTabs
        label="Content type"
        active={tab}
        tabs={TABS.map((t) => ({
          value: t.value,
          label: t.label,
          href: `/admin/content?tab=${t.value}`,
          count: t.value === "tools" ? tools.length : t.value === "articles" ? articles.length + guides.length : t.value === "categories" ? toolCategories.length : utilities.length,
        }))}
      />
      {tab === "tools" && <ToolsTable />}
      {tab === "articles" && <ArticlesTable />}
      {tab === "categories" && <CategoriesTable />}
      {tab === "utilities" && <UtilitiesTable />}
    </>
  );
}

const table = "w-full min-w-[40rem] text-left text-sm";
const th = "px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-5 py-3 align-middle";

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface shadow-soft">{children}</div>;
}

function ViewLink({ href }: { href: string }) {
  return (
    <Link href={href} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
      View <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}

async function ToolsTable() {
  const counts = await views("/tools/");
  const rows = [...tools].sort((a, b) => (counts.get(`/tools/${b.slug}`) ?? 0) - (counts.get(`/tools/${a.slug}`) ?? 0) || a.name.localeCompare(b.name));
  return (
    <Frame>
      <table className={table}>
        <thead className="border-b border-border">
          <tr>
            <th scope="col" className={th}>Tool</th>
            <th scope="col" className={th}>Category</th>
            <th scope="col" className={th}>Pricing</th>
            <th scope="col" className={th}>Affiliate</th>
            <th scope="col" className={`${th} text-right`}>Views (30d)</th>
            <th scope="col" className={th}><span className="sr-only">Link</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((tool) => (
            <tr key={tool.slug}>
              <td className={td}>
                <p className="font-medium text-foreground">{tool.name}</p>
                <p className="text-xs text-muted-foreground">{tool.developer}</p>
              </td>
              <td className={td}>{getToolCategory(tool.category)?.name ?? tool.category}</td>
              <td className={td}>
                <PricingBadge pricing={tool.pricing} />
              </td>
              <td className={td}>{tool.affiliate?.status === "active" ? <Badge tone="success">Active</Badge> : <span className="text-muted-foreground">—</span>}</td>
              <td className={`${td} text-right tabular-nums`}>{(counts.get(`/tools/${tool.slug}`) ?? 0).toLocaleString("en-US")}</td>
              <td className={td}>
                <ViewLink href={`/tools/${tool.slug}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

async function ArticlesTable() {
  const [blogViews, guideViews] = await Promise.all([views("/blog/"), views("/guides/")]);
  const rows = [
    ...articles.map((a) => ({ kind: "Article", title: a.title, href: `/blog/${a.slug}`, category: getArticleCategory(a.category)?.name ?? a.category, publishedAt: a.publishedAt, views: blogViews.get(`/blog/${a.slug}`) ?? 0 })),
    ...guides.map((g) => ({ kind: "Guide", title: g.title, href: `/guides/${g.slug}`, category: getGuideCategory(g.category)?.name ?? g.category, publishedAt: g.publishedAt, views: guideViews.get(`/guides/${g.slug}`) ?? 0 })),
  ].sort((a, b) => b.views - a.views || b.publishedAt.localeCompare(a.publishedAt));
  return (
    <Frame>
      <table className={table}>
        <thead className="border-b border-border">
          <tr>
            <th scope="col" className={th}>Title</th>
            <th scope="col" className={th}>Type</th>
            <th scope="col" className={th}>Published</th>
            <th scope="col" className={`${th} text-right`}>Views (30d)</th>
            <th scope="col" className={th}><span className="sr-only">Link</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.href}>
              <td className={td}>
                <p className="font-medium text-foreground">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.category}</p>
              </td>
              <td className={td}>
                <Badge tone={row.kind === "Guide" ? "accent" : "primary"}>{row.kind}</Badge>
              </td>
              <td className={td}>{formatDate(row.publishedAt)}</td>
              <td className={`${td} text-right tabular-nums`}>{row.views.toLocaleString("en-US")}</td>
              <td className={td}>
                <ViewLink href={row.href} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

async function CategoriesTable() {
  const counts = await views("/tools/category/");
  return (
    <Frame>
      <table className={table}>
        <thead className="border-b border-border">
          <tr>
            <th scope="col" className={th}>Category</th>
            <th scope="col" className={`${th} text-right`}>Tools</th>
            <th scope="col" className={`${th} text-right`}>Views (30d)</th>
            <th scope="col" className={th}><span className="sr-only">Link</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {toolCategories.map((c) => (
            <tr key={c.slug}>
              <td className={td}>
                <p className="font-medium text-foreground">{c.name}</p>
              </td>
              <td className={`${td} text-right tabular-nums`}>{tools.filter((t) => t.category === c.slug || t.secondaryCategories?.includes(c.slug)).length}</td>
              <td className={`${td} text-right tabular-nums`}>{(counts.get(`/tools/category/${c.slug}`) ?? 0).toLocaleString("en-US")}</td>
              <td className={td}>
                <ViewLink href={`/tools/category/${c.slug}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

async function UtilitiesTable() {
  const counts = await views("/free-ai-tools/");
  return (
    <Frame>
      <table className={table}>
        <thead className="border-b border-border">
          <tr>
            <th scope="col" className={th}>Free tool</th>
            <th scope="col" className={`${th} text-right`}>Views (30d)</th>
            <th scope="col" className={th}><span className="sr-only">Link</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {utilities.map((u) => (
            <tr key={u.slug}>
              <td className={td}>
                <p className="font-medium text-foreground">{u.name}</p>
              </td>
              <td className={`${td} text-right tabular-nums`}>{(counts.get(`/free-ai-tools/${u.slug}`) ?? 0).toLocaleString("en-US")}</td>
              <td className={td}>
                <ViewLink href={`/free-ai-tools/${u.slug}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}
