import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProvider } from "@/components/admin/admin-store";
import { articles } from "@/data/articles";
import { getArticleCategory, getGuideCategory, toolCategories } from "@/data/categories";
import { guides } from "@/data/guides";
import { siteConfig } from "@/data/site";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: `%s · Admin | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

/**
 * Admin area. Access is gated by `src/proxy.ts` (signed session cookie) and
 * every real data read/mutation re-checks the session (`requireAdmin`). The
 * Leads section is backed by MongoDB; the other sections are still a demo
 * that keeps changes in browser memory only.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminArticles = [
    ...articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: getArticleCategory(a.category)?.name ?? a.category,
      excerpt: a.excerpt,
      status: "published" as const,
      publishedAt: a.publishedAt,
      kind: "Article" as const,
    })),
    ...guides.map((g) => ({
      slug: g.slug,
      title: g.title,
      category: getGuideCategory(g.category)?.name ?? g.category,
      excerpt: g.excerpt,
      status: "published" as const,
      publishedAt: g.publishedAt,
      kind: "Guide" as const,
    })),
  ];

  return (
    <AdminProvider
      initial={{
        tools,
        categories: toolCategories,
        articles: adminArticles,
        settings: {
          siteName: siteConfig.name,
          tagline: siteConfig.tagline,
          contactEmail: siteConfig.email,
          titleTemplate: `%s | ${siteConfig.name}`,
          defaultDescription: siteConfig.description,
          canonicalUrl: siteConfig.url,
          allowIndexing: true,
        },
      }}
    >
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
