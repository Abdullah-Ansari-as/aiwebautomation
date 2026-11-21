"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/shared/button";
import { applyTheme, readThemePreference, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "../admin-shell";
import { useAdmin, type SiteSettings } from "../admin-store";
import { Card, Field, fieldClass, Toggle } from "../admin-ui";

function subscribeTheme(cb: () => void) {
  window.addEventListener("themechange", cb);
  return () => window.removeEventListener("themechange", cb);
}

const themes: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function SettingsView() {
  const { settings, saveSettings } = useAdmin();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [errors, setErrors] = useState<Partial<Record<keyof SiteSettings, string>>>({});
  const theme = useSyncExternalStore(subscribeTheme, readThemePreference, () => "system" as ThemePreference);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found: Partial<Record<keyof SiteSettings, string>> = {};
    if (!draft.siteName.trim()) found.siteName = "Site name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail)) found.contactEmail = "Enter a valid email.";
    if (!draft.titleTemplate.includes("%s")) found.titleTemplate = "The template must include %s for the page title.";
    if (!/^https:\/\/[^/\s]+\.[a-z]{2,}$/i.test(draft.canonicalUrl)) found.canonicalUrl = "Use an https:// origin with no trailing slash.";
    if (draft.defaultDescription.length > 160) found.defaultDescription = "Keep it at 160 characters or fewer.";
    setErrors(found);
    if (Object.keys(found).length === 0) saveSettings(draft);
  };

  return (
    <form onSubmit={submit} noValidate>
      <AdminPageHeader title="Settings" description="Site details, SEO defaults and appearance." action={<Button type="submit">Save changes</Button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="General">
          <div className="space-y-4 p-5">
            <Field label="Site name" htmlFor="set-name" error={errors.siteName}>
              <input id="set-name" value={draft.siteName} onChange={(e) => set("siteName", e.target.value)} className={cn(fieldClass, "h-11")} />
            </Field>
            <Field label="Tagline" htmlFor="set-tagline">
              <input id="set-tagline" value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} className={cn(fieldClass, "h-11")} />
            </Field>
            <Field label="Contact email" htmlFor="set-email" error={errors.contactEmail}>
              <input id="set-email" type="email" value={draft.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={cn(fieldClass, "h-11")} />
            </Field>
          </div>
        </Card>
        <Card title="SEO defaults">
          <div className="space-y-4 p-5">
            <Field label="Title template" htmlFor="set-template" error={errors.titleTemplate} hint="%s is replaced by each page's title.">
              <input id="set-template" value={draft.titleTemplate} onChange={(e) => set("titleTemplate", e.target.value)} className={cn(fieldClass, "h-11 font-mono")} />
            </Field>
            <Field label="Default meta description" htmlFor="set-desc" error={errors.defaultDescription} hint={`${draft.defaultDescription.length}/160 characters`}>
              <textarea id="set-desc" rows={3} value={draft.defaultDescription} onChange={(e) => set("defaultDescription", e.target.value)} className={cn(fieldClass, "py-3")} />
            </Field>
            <Field label="Canonical domain" htmlFor="set-url" error={errors.canonicalUrl}>
              <input id="set-url" value={draft.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} className={cn(fieldClass, "h-11 font-mono")} />
            </Field>
            <div className="rounded-xl border border-border p-4">
              <Toggle id="set-index" checked={draft.allowIndexing} onChange={(v) => set("allowIndexing", v)} label="Allow search engine indexing" description="Controls the default robots directive." />
            </div>
            <div className="rounded-xl bg-surface-muted/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Search preview</p>
              <p className="mt-2 truncate text-xs text-success">{draft.canonicalUrl}</p>
              <p className="truncate text-lg text-accent">{draft.titleTemplate.replace("%s", "AI Tools Directory")}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{draft.defaultDescription}</p>
            </div>
          </div>
        </Card>
        <Card title="Theme" className="xl:col-span-2">
          <div className="p-5">
            <p className="text-sm text-muted-foreground">Choose how the dashboard and website look on this device. This preference is stored in your browser.</p>
            <div role="radiogroup" aria-label="Theme" className="mt-4 grid gap-3 sm:grid-cols-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={theme === t.id}
                  onClick={() => applyTheme(t.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5",
                    theme === t.id ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40",
                  )}
                >
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", theme === t.id ? "bg-primary text-white dark:text-primary-foreground" : "bg-surface-muted text-muted-foreground")}>
                    <t.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-medium text-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Demo: saved settings apply to this dashboard session only. Production values live in <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">src/data/site.ts</code>.
      </p>
    </form>
  );
}
