"use client";

import { AnimatePresence, m } from "framer-motion";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { Modal } from "@/components/shared/modal";
import { SearchInput } from "@/components/shared/search-input";
import { articleCategories, guideCategories } from "@/data/categories";
import { cn, formatDate, matchesQuery, slugify } from "@/lib/utils";
import { AdminPageHeader } from "../admin-shell";
import { useAdmin, type AdminArticle } from "../admin-store";
import { Card, Field, fieldClass, tableClass, tdClass, thClass } from "../admin-ui";

type StatusFilter = "all" | AdminArticle["status"];

export function ArticlesView() {
  const { articles, upsertArticle, deleteArticle } = useAdmin();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminArticle | null>(null);
  const [draft, setDraft] = useState<Omit<AdminArticle, "slug" | "publishedAt">>({ title: "", category: articleCategories[0].name, excerpt: "", status: "draft", kind: "Article" });
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<AdminArticle | null>(null);

  const rows = useMemo(
    () => articles.filter((a) => (status === "all" || a.status === status) && matchesQuery(query, a.title, a.category, a.kind)),
    [articles, query, status],
  );

  const categoryOptions = draft.kind === "Guide" ? guideCategories.map((c) => c.name) : articleCategories.map((c) => c.name);

  const start = (article: AdminArticle | null) => {
    setEditing(article);
    setDraft(article ? { title: article.title, category: article.category, excerpt: article.excerpt, status: article.status, kind: article.kind } : { title: "", category: articleCategories[0].name, excerpt: "", status: "draft", kind: "Article" });
    setError("");
    setOpen(true);
  };

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    if (draft.title.trim().length < 5) return setError("Title must be at least 5 characters.");
    const slug = editing?.slug ?? slugify(draft.title);
    upsertArticle({ ...draft, title: draft.title.trim(), slug, publishedAt: editing?.publishedAt ?? new Date().toISOString().slice(0, 10) }, editing?.slug);
    setOpen(false);
  };

  return (
    <>
      <AdminPageHeader
        title="Articles"
        description={`${articles.filter((a) => a.status === "published").length} published · ${articles.filter((a) => a.status === "draft").length} drafts`}
        action={
          <Button onClick={() => start(null)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New article
          </Button>
        }
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search articles…" label="Search articles" className="flex-1" />
          <div role="tablist" aria-label="Status" className="flex gap-1 rounded-xl border border-border p-1">
            {(["all", "published", "draft"] as const).map((s) => (
              <button key={s} type="button" role="tab" aria-selected={status === s} onClick={() => setStatus(s)} className={cn("rounded-lg px-3 py-1.5 text-sm capitalize transition-colors", status === s ? "bg-primary text-white dark:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className="border-b border-border bg-surface-muted/40">
              <tr>
                <th scope="col" className={thClass}>Title</th>
                <th scope="col" className={thClass}>Type</th>
                <th scope="col" className={thClass}>Status</th>
                <th scope="col" className={thClass}>Date</th>
                <th scope="col" className={cn(thClass, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {rows.map((a) => (
                  <m.tr key={a.slug} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -12 }} className="hover:bg-surface-muted/40">
                    <td className={cn(tdClass, "max-w-md")}>
                      <p className="truncate font-medium text-foreground">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.category}</p>
                    </td>
                    <td className={cn(tdClass, "text-muted-foreground")}>{a.kind}</td>
                    <td className={tdClass}>
                      <Badge tone={a.status === "published" ? "success" : "neutral"}>{a.status === "published" ? "Published" : "Draft"}</Badge>
                    </td>
                    <td className={cn(tdClass, "whitespace-nowrap text-muted-foreground")}>{formatDate(a.publishedAt)}</td>
                    <td className={cn(tdClass, "text-right")}>
                      <div className="inline-flex gap-1">
                        {a.status === "published" && (
                          <Link href={a.kind === "Guide" ? `/guides/${a.slug}` : `/blog/${a.slug}`} className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground" aria-label={`View ${a.title}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <button type="button" onClick={() => start(a)} className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground" aria-label={`Edit ${a.title}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setToDelete(a)} className="rounded-lg p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${a.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </m.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No articles found.</p>}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit article" : "New article"}
        description="Article bodies will be editable once a CMS or database is connected."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save()}>{draft.status === "published" ? "Publish" : "Save draft"}</Button>
          </>
        }
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <Field label="Title" htmlFor="art-title" error={error}>
              <input id="art-title" value={draft.title} onChange={(e) => { setDraft((d) => ({ ...d, title: e.target.value })); setError(""); }} className={cn(fieldClass, "h-11")} />
            </Field>
          </div>
          <Field label="Type" htmlFor="art-kind">
            <select
              id="art-kind"
              value={draft.kind}
              onChange={(e) => {
                const kind = e.target.value as AdminArticle["kind"];
                setDraft((d) => ({ ...d, kind, category: kind === "Guide" ? guideCategories[0].name : articleCategories[0].name }));
              }}
              className={cn(fieldClass, "h-11")}
              disabled={Boolean(editing)}
            >
              <option>Article</option>
              <option>Guide</option>
            </select>
          </Field>
          <Field label="Category" htmlFor="art-category">
            <select id="art-category" value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} className={cn(fieldClass, "h-11")}>
              {categoryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Excerpt" htmlFor="art-excerpt" hint={`${draft.excerpt.length}/160 characters — used as the meta description.`}>
              <textarea id="art-excerpt" rows={3} value={draft.excerpt} onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))} className={cn(fieldClass, "py-3")} />
            </Field>
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium text-foreground">Status</legend>
            <div className="flex gap-2">
              {(["draft", "published"] as const).map((s) => (
                <label key={s} className={cn("flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm capitalize transition-colors", draft.status === s ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground")}>
                  <input type="radio" name="art-status" value={s} checked={draft.status === s} onChange={() => setDraft((d) => ({ ...d, status: s }))} className="accent-[var(--primary)]" />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="sr-only">Save</button>
        </form>
      </Modal>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete article?"
        description={toDelete ? `“${toDelete.title}” will be removed from this demo session.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { if (toDelete) deleteArticle(toDelete.slug); setToDelete(null); }}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">The public site is not affected — this is a demo.</p>
      </Modal>
    </>
  );
}
