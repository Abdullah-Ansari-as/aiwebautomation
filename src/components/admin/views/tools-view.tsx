"use client";

import { AnimatePresence, m } from "framer-motion";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { PricingBadge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { Modal } from "@/components/shared/modal";
import { SearchInput } from "@/components/shared/search-input";
import { ToolLogo } from "@/components/tools/tool-logo";
import { cn, matchesQuery, slugify } from "@/lib/utils";
import type { AITool, PricingModel, ToolCategorySlug } from "@/types";
import { AdminPageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { Card, Field, fieldClass, tableClass, tdClass, thClass, Toggle } from "../admin-ui";

interface ToolDraft {
  name: string;
  developer: string;
  website: string;
  category: ToolCategorySlug;
  pricing: PricingModel;
  description: string;
  featured: boolean;
}

const emptyDraft: ToolDraft = {
  name: "",
  developer: "",
  website: "https://",
  category: "ai-writing",
  pricing: "Freemium",
  description: "",
  featured: false,
};

function validate(d: ToolDraft): Partial<Record<keyof ToolDraft, string>> {
  const errors: Partial<Record<keyof ToolDraft, string>> = {};
  if (!d.name.trim()) errors.name = "Name is required.";
  if (!d.developer.trim()) errors.developer = "Developer is required.";
  try {
    const u = new URL(d.website);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) throw new Error();
  } catch {
    errors.website = "Enter a valid URL (https://…).";
  }
  if (d.description.trim().length < 20) errors.description = "Write at least 20 characters.";
  return errors;
}

export function ToolsView() {
  const { tools, categories, upsertTool, deleteTool } = useAdmin();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editing, setEditing] = useState<AITool | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<ToolDraft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof ToolDraft, string>>>({});
  const [toDelete, setToDelete] = useState<AITool | null>(null);

  const rows = useMemo(
    () => tools.filter((t) => (!categoryFilter || t.category === categoryFilter) && matchesQuery(query, t.name, t.developer, t.category)),
    [tools, query, categoryFilter],
  );

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (tool: AITool) => {
    setEditing(tool);
    setDraft({
      name: tool.name,
      developer: tool.developer,
      website: tool.website,
      category: tool.category,
      pricing: tool.pricing,
      description: tool.description,
      featured: Boolean(tool.featured),
    });
    setErrors({});
    setFormOpen(true);
  };

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    const found = validate(draft);
    const slug = editing?.slug ?? slugify(draft.name);
    if (!editing && tools.some((t) => t.slug === slug)) found.name = "A tool with this name already exists.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const base: AITool = editing ?? {
      slug,
      name: "",
      developer: "",
      tagline: "",
      description: "",
      overview: [],
      category: draft.category,
      pricing: draft.pricing,
      pricingDetails: "Check the official pricing page for current plans.",
      features: [],
      pros: [],
      cons: [],
      useCases: [],
      alternatives: [],
      website: "",
      platforms: ["Web"],
      brandColors: ["#6d4aff", "#2f6bff"],
      popularityRank: tools.length + 1,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    upsertTool(
      {
        ...base,
        name: draft.name.trim(),
        developer: draft.developer.trim(),
        website: draft.website.trim(),
        category: draft.category,
        pricing: draft.pricing,
        description: draft.description.trim(),
        tagline: base.tagline || draft.description.trim().slice(0, 70),
        featured: draft.featured,
      },
      editing?.slug,
    );
    setFormOpen(false);
  };

  const set = <K extends keyof ToolDraft>(key: K, value: ToolDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <>
      <AdminPageHeader
        title="AI Tools"
        description={`${tools.length} tools in the directory.`}
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add tool
          </Button>
        }
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="Search tools…" label="Search tools" className="flex-1" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category" className={cn(fieldClass, "h-12 sm:w-56")}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className="border-b border-border bg-surface-muted/40">
              <tr>
                <th scope="col" className={thClass}>Tool</th>
                <th scope="col" className={thClass}>Category</th>
                <th scope="col" className={thClass}>Pricing</th>
                <th scope="col" className={thClass}>Featured</th>
                <th scope="col" className={cn(thClass, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {rows.map((tool) => (
                  <m.tr key={tool.slug} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -12 }} className="hover:bg-surface-muted/40">
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <ToolLogo tool={tool} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{tool.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{tool.developer}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cn(tdClass, "whitespace-nowrap text-muted-foreground")}>{categories.find((c) => c.slug === tool.category)?.name ?? tool.category}</td>
                    <td className={tdClass}>
                      <PricingBadge pricing={tool.pricing} />
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => upsertTool({ ...tool, featured: !tool.featured }, tool.slug)}
                        aria-pressed={Boolean(tool.featured)}
                        aria-label={`${tool.featured ? "Unfeature" : "Feature"} ${tool.name}`}
                        className={cn("rounded-lg p-1.5 transition-colors hover:bg-surface-muted", tool.featured ? "text-warning" : "text-muted-foreground")}
                      >
                        <Star className="h-4 w-4" fill={tool.featured ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className={cn(tdClass, "text-right")}>
                      <div className="inline-flex gap-1">
                        <button type="button" onClick={() => openEdit(tool)} className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground" aria-label={`Edit ${tool.name}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setToDelete(tool)} className="rounded-lg p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${tool.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </m.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No tools match your search.</p>}
        </div>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add a new tool"}
        description="Changes apply to this demo session only."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save()}>{editing ? "Save changes" : "Add tool"}</Button>
          </>
        }
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Tool name" htmlFor="tool-name" error={errors.name}>
            <input id="tool-name" value={draft.name} onChange={(e) => set("name", e.target.value)} className={cn(fieldClass, "h-11")} aria-invalid={Boolean(errors.name)} />
          </Field>
          <Field label="Developer" htmlFor="tool-dev" error={errors.developer}>
            <input id="tool-dev" value={draft.developer} onChange={(e) => set("developer", e.target.value)} className={cn(fieldClass, "h-11")} aria-invalid={Boolean(errors.developer)} />
          </Field>
          <Field label="Category" htmlFor="tool-category">
            <select id="tool-category" value={draft.category} onChange={(e) => set("category", e.target.value as ToolCategorySlug)} className={cn(fieldClass, "h-11")}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pricing" htmlFor="tool-pricing">
            <select id="tool-pricing" value={draft.pricing} onChange={(e) => set("pricing", e.target.value as PricingModel)} className={cn(fieldClass, "h-11")}>
              {(["Free", "Freemium", "Paid"] as const).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Official website" htmlFor="tool-website" error={errors.website}>
              <input id="tool-website" type="url" value={draft.website} onChange={(e) => set("website", e.target.value)} className={cn(fieldClass, "h-11")} aria-invalid={Boolean(errors.website)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="tool-desc" error={errors.description} hint="Shown on tool cards (1–2 sentences).">
              <textarea id="tool-desc" rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} className={cn(fieldClass, "py-3")} aria-invalid={Boolean(errors.description)} />
            </Field>
          </div>
          <div className="rounded-xl border border-border p-4 sm:col-span-2">
            <Toggle id="tool-featured" checked={draft.featured} onChange={(v) => set("featured", v)} label="Featured tool" description="Featured tools appear on the homepage." />
          </div>
          <button type="submit" className="sr-only">
            Save
          </button>
        </form>
      </Modal>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete tool?"
        description={toDelete ? `“${toDelete.name}” will be removed from this demo session.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toDelete) deleteTool(toDelete.slug);
                setToDelete(null);
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This can&apos;t be undone in the session, but reloading the page restores the original data.</p>
      </Modal>
    </>
  );
}
