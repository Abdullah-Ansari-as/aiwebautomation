"use client";

import { Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import { Modal } from "@/components/shared/modal";
import { cn, slugify } from "@/lib/utils";
import type { IconKey, ToolCategory, ToolCategorySlug } from "@/types";
import { AdminPageHeader } from "../admin-shell";
import { useAdmin } from "../admin-store";
import { Field, fieldClass } from "../admin-ui";

const ICONS: IconKey[] = ["pen", "image", "video", "code", "gauge", "megaphone", "workflow", "briefcase", "sparkles", "brain", "cloud", "headphones", "users", "target"];

export function CategoriesView() {
  const { categories, tools, upsertCategory } = useAdmin();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ToolCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<IconKey>("sparkles");
  const [error, setError] = useState("");

  const start = (category: ToolCategory | null) => {
    setEditing(category);
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
    setIcon(category?.icon ?? "sparkles");
    setError("");
    setOpen(true);
  };

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    if (!name.trim()) return setError("Name is required.");
    const slug = (editing?.slug ?? slugify(name)) as ToolCategorySlug;
    if (!editing && categories.some((c) => c.slug === slug)) return setError("A category with this name already exists.");
    upsertCategory(
      { slug, name: name.trim(), description: description.trim(), icon, gradient: editing?.gradient ?? ["#6d4aff", "#2f6bff"] },
      editing?.slug,
    );
    setOpen(false);
  };

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Organise the tools directory."
        action={
          <Button onClick={() => start(null)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New category
          </Button>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const count = tools.filter((t) => t.category === c.slug).length;
          return (
            <li key={c.slug} className="group flex gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})` }}>
                <Icon name={c.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-foreground">{c.name}</h2>
                  <button type="button" onClick={() => start(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground" aria-label={`Edit ${c.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {count} primary {count === 1 ? "tool" : "tools"} · /{c.slug}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Create category"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save()}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="cat-name" error={error} hint={name ? `Slug: ${editing?.slug ?? slugify(name)}` : undefined}>
            <input id="cat-name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} className={cn(fieldClass, "h-11")} />
          </Field>
          <Field label="Description" htmlFor="cat-desc">
            <textarea id="cat-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={cn(fieldClass, "py-3")} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">Icon</legend>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  aria-pressed={icon === key}
                  aria-label={key}
                  className={cn("flex h-10 w-10 items-center justify-center rounded-xl border transition-colors", icon === key ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}
                >
                  <Icon name={key} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="sr-only">Save</button>
        </form>
      </Modal>
    </>
  );
}
