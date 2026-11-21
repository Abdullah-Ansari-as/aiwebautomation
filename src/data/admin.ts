/**
 * SAMPLE DATA for the admin dashboard demo. None of these numbers are real
 * traffic or real submissions — they exist so the dashboard UI can be
 * evaluated before analytics and a database are connected.
 */
import type { PricingModel, ToolCategorySlug } from "@/types";

export interface ToolSubmission {
  id: string;
  toolName: string;
  website: string;
  category: ToolCategorySlug;
  pricing: PricingModel;
  description: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export const sampleSubmissions: ToolSubmission[] = [
  {
    id: "sub-1001",
    toolName: "Example Notes AI",
    website: "https://example.com/notes-ai",
    category: "ai-productivity",
    pricing: "Freemium",
    description: "Sample submission: a note-taking assistant that turns meeting notes into tasks.",
    submittedBy: "founder@example.com",
    submittedAt: "2026-11-05",
    status: "pending",
  },
  {
    id: "sub-1002",
    toolName: "Sample Video Captioner",
    website: "https://example.com/captioner",
    category: "ai-video",
    pricing: "Paid",
    description: "Sample submission: generates subtitles and translated captions for short videos.",
    submittedBy: "team@example.org",
    submittedAt: "2026-11-03",
    status: "pending",
  },
  {
    id: "sub-1003",
    toolName: "Demo SQL Helper",
    website: "https://example.com/sql-helper",
    category: "ai-coding",
    pricing: "Free",
    description: "Sample submission: explains SQL queries and suggests indexes.",
    submittedBy: "dev@example.net",
    submittedAt: "2026-10-29",
    status: "pending",
  },
  {
    id: "sub-1004",
    toolName: "Placeholder Ad Writer",
    website: "https://example.com/ad-writer",
    category: "ai-marketing",
    pricing: "Freemium",
    description: "Sample submission: drafts ad variations for search and social campaigns.",
    submittedBy: "growth@example.com",
    submittedAt: "2026-10-22",
    status: "rejected",
  },
];

export interface ActivityItem {
  id: string;
  message: string;
  at: string;
  kind: "tool" | "article" | "category" | "submission" | "settings";
}

export const sampleActivity: ActivityItem[] = [
  { id: "a1", message: "Sample: tool listing for Zapier reviewed", at: "2026-11-06", kind: "tool" },
  { id: "a2", message: "Sample: article “Best AI writing tools compared” published", at: "2026-10-28", kind: "article" },
  { id: "a3", message: "Sample: new submission received", at: "2026-11-05", kind: "submission" },
  { id: "a4", message: "Sample: SEO defaults updated", at: "2026-10-20", kind: "settings" },
];

/** Sample weekly page views (12 weeks). */
export const sampleWeeklyViews = [
  { week: "Aug 17", views: 3200 },
  { week: "Aug 24", views: 3550 },
  { week: "Aug 31", views: 3480 },
  { week: "Sep 7", views: 4100 },
  { week: "Sep 14", views: 4420 },
  { week: "Sep 21", views: 4310 },
  { week: "Sep 28", views: 5050 },
  { week: "Oct 5", views: 5480 },
  { week: "Oct 12", views: 5320 },
  { week: "Oct 19", views: 6020 },
  { week: "Oct 26", views: 6540 },
  { week: "Nov 2", views: 6910 },
];

/** Sample views per tool page, keyed by tool slug. */
export const sampleToolViews: Record<string, number> = {
  chatgpt: 4820,
  claude: 3960,
  midjourney: 3110,
  "github-copilot": 2870,
  zapier: 2540,
  perplexity: 2310,
  cursor: 2180,
  runway: 1720,
  n8n: 1640,
  "notion-ai": 1390,
};

/** Sample reads per article, keyed by article slug. */
export const sampleArticleReads: Record<string, number> = {
  "best-ai-writing-tools-compared": 2940,
  "chatgpt-vs-claude-vs-gemini": 2610,
  "zapier-vs-make-vs-n8n": 2050,
  "what-is-ai-workflow-automation": 1830,
  "how-large-language-models-work": 1570,
  "ai-coding-assistants-for-developers": 1320,
};
