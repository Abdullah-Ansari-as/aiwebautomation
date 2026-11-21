"use client";

import { AnimatePresence, m } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { sampleActivity, sampleSubmissions, type ActivityItem, type ToolSubmission } from "@/data/admin";
import type { AITool, ToolCategory } from "@/types";

/**
 * In-memory admin state for the demo dashboard. Everything is seeded from the
 * static data files and lives only in this browser tab — nothing is persisted
 * to a server, and a reload resets it. Replace these reducers with API calls
 * when a backend exists.
 */

export interface AdminArticle {
  slug: string;
  title: string;
  /** Display name of the article or guide category. */
  category: string;
  excerpt: string;
  status: "published" | "draft";
  publishedAt: string;
  kind: "Article" | "Guide";
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  titleTemplate: string;
  defaultDescription: string;
  canonicalUrl: string;
  allowIndexing: boolean;
}

interface AdminState {
  tools: AITool[];
  categories: ToolCategory[];
  articles: AdminArticle[];
  submissions: ToolSubmission[];
  activity: ActivityItem[];
  settings: SiteSettings;
}

interface AdminContextValue extends AdminState {
  upsertTool: (tool: AITool, originalSlug?: string) => void;
  deleteTool: (slug: string) => void;
  upsertCategory: (category: ToolCategory, originalSlug?: string) => void;
  upsertArticle: (article: AdminArticle, originalSlug?: string) => void;
  deleteArticle: (slug: string) => void;
  setSubmissionStatus: (id: string, status: ToolSubmission["status"]) => void;
  saveSettings: (settings: SiteSettings) => void;
  notify: (message: string) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AdminProvider({ initial, children }: { initial: Omit<AdminState, "submissions" | "activity">; children: ReactNode }) {
  const [state, setState] = useState<AdminState>({ ...initial, submissions: sampleSubmissions, activity: sampleActivity });
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const log = useCallback((message: string, kind: ActivityItem["kind"]) => {
    setState((s) => ({ ...s, activity: [{ id: `act-${Date.now()}`, message, at: today(), kind }, ...s.activity].slice(0, 20) }));
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      ...state,
      notify,
      upsertTool: (tool, originalSlug) => {
        setState((s) => {
          const exists = s.tools.some((t) => t.slug === (originalSlug ?? tool.slug));
          return {
            ...s,
            tools: exists ? s.tools.map((t) => (t.slug === (originalSlug ?? tool.slug) ? tool : t)) : [tool, ...s.tools],
          };
        });
        log(`${originalSlug ? "Updated" : "Added"} tool “${tool.name}”`, "tool");
        notify(`${tool.name} ${originalSlug ? "updated" : "added"} (demo — not saved)`);
      },
      deleteTool: (slug) => {
        const name = state.tools.find((t) => t.slug === slug)?.name ?? slug;
        setState((s) => ({ ...s, tools: s.tools.filter((t) => t.slug !== slug) }));
        log(`Deleted tool “${name}”`, "tool");
        notify(`${name} deleted (demo — not saved)`);
      },
      upsertCategory: (category, originalSlug) => {
        setState((s) => {
          const exists = s.categories.some((c) => c.slug === (originalSlug ?? category.slug));
          return {
            ...s,
            categories: exists
              ? s.categories.map((c) => (c.slug === (originalSlug ?? category.slug) ? category : c))
              : [...s.categories, category],
          };
        });
        log(`${originalSlug ? "Updated" : "Created"} category “${category.name}”`, "category");
        notify(`Category ${originalSlug ? "updated" : "created"} (demo — not saved)`);
      },
      upsertArticle: (article, originalSlug) => {
        setState((s) => {
          const exists = s.articles.some((a) => a.slug === (originalSlug ?? article.slug));
          return {
            ...s,
            articles: exists ? s.articles.map((a) => (a.slug === (originalSlug ?? article.slug) ? article : a)) : [article, ...s.articles],
          };
        });
        log(`${originalSlug ? "Updated" : "Created"} ${article.status} “${article.title}”`, "article");
        notify(`Article ${originalSlug ? "updated" : "created"} (demo — not saved)`);
      },
      deleteArticle: (slug) => {
        setState((s) => ({ ...s, articles: s.articles.filter((a) => a.slug !== slug) }));
        log(`Deleted article “${slug}”`, "article");
        notify("Article deleted (demo — not saved)");
      },
      setSubmissionStatus: (id, status) => {
        const sub = state.submissions.find((x) => x.id === id);
        setState((s) => ({ ...s, submissions: s.submissions.map((x) => (x.id === id ? { ...x, status } : x)) }));
        if (sub) {
          log(`${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Reopened"} submission “${sub.toolName}”`, "submission");
          notify(`${sub.toolName} ${status} (demo — not saved)`);
        }
      },
      saveSettings: (settings) => {
        setState((s) => ({ ...s, settings }));
        log("Updated site settings", "settings");
        notify("Settings applied for this session (demo — not saved)");
      },
    }),
    [state, notify, log],
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <m.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground shadow-lift"
            >
              <CircleCheck className="h-4 w-4 text-success" aria-hidden="true" />
              {t.message}
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </AdminContext.Provider>
  );
}
