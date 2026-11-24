"use client";

import { AnimatePresence, m } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  Library,
  LogOut,
  Mail,
  Menu,
  Settings,
  Sparkles,
  UserCog,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { logout } from "@/lib/actions/admin-auth";
import { roleLabel, type AdminRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

export interface AdminShellUser {
  name: string;
  email: string;
  role: AdminRole;
}

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; superadminOnly?: boolean };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Business",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/leads", label: "Leads", icon: UserRoundPlus },
      { href: "/admin/clients", label: "Clients", icon: Briefcase },
      { href: "/admin/invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Inbox",
    items: [
      { href: "/admin/messages", label: "Messages", icon: Inbox },
      { href: "/admin/submissions", label: "Tool submissions", icon: Sparkles },
      { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/content", label: "Content", icon: Library },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/team", label: "Team", icon: Users, superadminOnly: true },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/account", label: "My account", icon: UserCog },
    ],
  },
];

function SidebarNav({ user, badges, onNavigate }: { user: AdminShellUser; badges: Record<string, number>; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items
              .filter((item) => !item.superadminOnly || user.role === "superadmin")
              .map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const badge = badges[item.href] ?? 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active ? "text-primary" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                      )}
                    >
                      {active && <m.span layoutId="admin-nav-active" className="absolute inset-0 rounded-xl bg-primary-soft" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                      <item.icon className="relative h-4 w-4" aria-hidden="true" />
                      <span className="relative flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className={cn("relative rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", item.href === "/admin/invoices" ? "bg-danger text-white" : "bg-primary text-white dark:text-primary-foreground")}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SidebarFooter({ user }: { user: AdminShellUser }) {
  return (
    <div className="space-y-1 border-t border-border pt-4">
      <div className="px-3 pb-2">
        <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {roleLabel(user.role)} · {user.email}
        </p>
      </div>
      <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">
        <ExternalLink className="h-4 w-4" aria-hidden="true" /> View website
      </Link>
    </div>
  );
}

export function AdminShell({ user, badges, children }: { user: AdminShellUser; badges: Record<string, number>; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-border bg-surface px-4 py-5 lg:flex">
        <Logo className="px-2" />
        <p className="mt-1 px-2 text-xs text-muted-foreground">Business dashboard</p>
        <nav aria-label="Admin" className="mt-6 flex-1">
          <SidebarNav user={user} badges={badges} />
        </nav>
        <SidebarFooter user={user} />
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
              className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto border-r border-border bg-surface px-4 py-5"
            >
              <div className="flex items-center justify-between">
                <Logo className="px-2" />
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav aria-label="Admin mobile" className="mt-6 flex-1">
                <SidebarNav user={user} badges={badges} onNavigate={() => setOpen(false)} />
              </nav>
              <SidebarFooter user={user} />
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
            <p className="hidden text-sm text-muted-foreground sm:block">
              Signed in as <span className="font-medium text-foreground">{user.name}</span>
              <span className="ml-2 rounded-full border border-primary/20 bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{roleLabel(user.role)}</span>
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

export function AdminPageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
