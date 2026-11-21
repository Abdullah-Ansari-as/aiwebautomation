import type { MetadataRoute } from "next";
import { articles } from "@/data/articles";
import { toolCategories } from "@/data/categories";
import { guides } from "@/data/guides";
import { tools } from "@/data/tools";
import { utilities } from "@/data/utilities";
import { absoluteUrl } from "@/lib/seo";

/** Date of the latest content change — static content has no request-time clock. */
const CONTENT_UPDATED = "2026-11-18";

const staticRoutes: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/tools", priority: 0.9, changeFrequency: "daily" },
  { path: "/free-ai-tools", priority: 0.9, changeFrequency: "weekly" },
  { path: "/automation", priority: 0.8, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { path: "/technology", priority: 0.7, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/submit-tool", priority: 0.4, changeFrequency: "monthly" },
  { path: "/editorial-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/write-for-us", priority: 0.3, changeFrequency: "yearly" },
  { path: "/advertise", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/disclaimer", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((r) => ({
      url: absoluteUrl(r.path),
      lastModified: CONTENT_UPDATED,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...toolCategories.map((c) => ({
      url: absoluteUrl(`/tools/category/${c.slug}`),
      lastModified: CONTENT_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...tools.map((t) => ({
      url: absoluteUrl(`/tools/${t.slug}`),
      lastModified: t.addedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...utilities.map((u) => ({
      url: absoluteUrl(`/free-ai-tools/${u.slug}`),
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: absoluteUrl(`/blog/${a.slug}`),
      lastModified: a.updatedAt ?? a.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...guides.map((g) => ({
      url: absoluteUrl(`/guides/${g.slug}`),
      lastModified: g.updatedAt ?? g.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
