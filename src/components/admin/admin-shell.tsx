"use client";

import { AnimatePresence, m } from "framer-motion";
import { BarChart3, ExternalLink, FolderTree, Inbox, LayoutDashboard, LogOut, Menu, Newspaper, Settings, Sparkles, TriangleAlert, UserRoundPlus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { logout } from "@/lib/actions/admin-auth";
import { cn } from "@/lib/utils";
import { useAdmin } from "./admin-store";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: UserRoundPlus },
  { href: "/admin/tools", label: "AI Tools", icon: Sparkles },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/articles", label: "Articles", icon: Newspaper },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { submissions } = useAdmin();
  const pending = submissions.filter((s) => s.status === "pending").length;
  return (
    <ul className="space-y-1">
      {nav.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {active && <m.span layoutId="admin-nav-active" className="absolute inset-0 rounded-xl bg-primary-soft" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              <item.icon className="relative h-4 w-4" aria-hidden="true" />
              <span className="relative flex-1">{item.label}</span>
              {item.href === "/admin/submissions" && pending > 0 && (
                <span className="relative rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-semibold text-white dark:text-primary-foreground">{pending}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
        <Logo className="px-2" />
        <p className="mt-1 px-2 text-xs text-muted-foreground">Admin dashboard</p>
        <nav aria-label="Admin" className="mt-8 flex-1">
          <SidebarNav />
        </nav>
        <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> View website
        </Link>
      </aside>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <m.div className="absolute inset-0 bg-[#050816]/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <m.aside
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface px-4 py-5"
            >
              <div className="flex items-center justify-between">
                <Logo className="px-2" />
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav aria-label="Admin mobile" className="mt-8 flex-1">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </nav>
              <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface-muted">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> View website
              </Link>
            </m.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border lg:hidden" aria-label="Open admin menu">
              <Menu className="h-5 w-5" />
            </button>
            <p className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-foreground">
              <TriangleAlert className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
              <span className="hidden sm:inline">Leads are live · other sections are a demo with sample data that isn&apos;t saved</span>
              <span className="sm:hidden">Leads live · rest is demo</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main id="main-content" className="px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
