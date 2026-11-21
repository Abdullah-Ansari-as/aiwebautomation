import { articles } from "@/data/articles";
import { guides } from "@/data/guides";
import { tools } from "@/data/tools";
import { utilities } from "@/data/utilities";
import { toolCategories } from "@/data/categories";

export type SearchKind = "Tool" | "Utility" | "Article" | "Guide" | "Category" | "Page";

export interface SearchEntry {
  kind: SearchKind;
  title: string;
  description: string;
  href: string;
  keywords?: string;
}

const pages: SearchEntry[] = [
  { kind: "Page", title: "AI Tools Directory", description: "Search and filter AI tools", href: "/tools" },
  { kind: "Page", title: "Free AI Utilities", description: "Browser-based tools you can use now", href: "/free-ai-tools" },
  { kind: "Page", title: "AI Automation", description: "Workflow automation resources", href: "/automation" },
  { kind: "Page", title: "Automation Services", description: "Hire us to build your automations — n8n, Make, Zapier, CRM, chatbots", href: "/services" },
  { kind: "Page", title: "How-To Guides", description: "Step-by-step tutorials", href: "/guides" },
  { kind: "Page", title: "Technology", description: "AI, ML, SaaS and cloud insights", href: "/technology" },
  { kind: "Page", title: "Blog", description: "Latest articles", href: "/blog" },
  { kind: "Page", title: "About Us", description: "Our mission and editorial approach", href: "/about" },
  { kind: "Page", title: "Contact Us", description: "Get in touch with the team", href: "/contact" },
  { kind: "Page", title: "Submit a Tool", description: "Suggest an AI tool for the directory", href: "/submit-tool" },
];

/** Compact, serialisable index used by the global ⌘K search dialog. */
export function buildSearchIndex(): SearchEntry[] {
  return [
    ...tools.map<SearchEntry>((t) => ({
      kind: "Tool",
      title: t.name,
      description: t.tagline,
      href: `/tools/${t.slug}`,
      keywords: `${t.developer} ${t.category} ${t.pricing}`,
    })),
    ...utilities.map<SearchEntry>((u) => ({
      kind: "Utility",
      title: u.name,
      description: u.shortDescription,
      href: `/free-ai-tools/${u.slug}`,
      keywords: u.group,
    })),
    ...toolCategories.map<SearchEntry>((c) => ({
      kind: "Category",
      title: c.name,
      description: c.description,
      href: `/tools/category/${c.slug}`,
    })),
    ...guides.map<SearchEntry>((g) => ({
      kind: "Guide",
      title: g.title,
      description: g.excerpt,
      href: `/guides/${g.slug}`,
      keywords: g.tags.join(" "),
    })),
    ...articles.map<SearchEntry>((a) => ({
      kind: "Article",
      title: a.title,
      description: a.excerpt,
      href: `/blog/${a.slug}`,
      keywords: a.tags.join(" "),
    })),
    ...pages,
  ];
}
