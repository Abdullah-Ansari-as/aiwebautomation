"use client";

import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { hireUsNav, mainNav } from "@/data/navigation";
import type { SearchEntry } from "@/lib/search-index";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/icon";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";
import type { NavItem } from "@/types";

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ searchIndex }: { searchIndex: SearchEntry[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled
            ? "border-border bg-background/80 shadow-[0_8px_30px_-20px_rgb(0_0_0/0.25)] backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <div className="container-site flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
          <Logo />

          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-0.5">
              {mainNav.map((item) =>
                item.children ? (
                  <DropdownNavItem key={item.href} item={item} active={isActivePath(pathname, item.href) || pathname.startsWith("/free-ai-tools")} />
                ) : (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                      className={cn(
                        "relative block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActivePath(pathname, item.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isActivePath(pathname, item.href) && (
                        <m.span
                          layoutId="nav-active-pill"
                          className="absolute inset-0 -z-10 rounded-lg bg-surface-muted"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-surface/70 pl-3 pr-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:inline-flex"
              aria-label="Search the site (Ctrl+K)"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden rounded-md border border-border bg-surface-muted px-1.5 py-0.5 font-sans text-[0.65rem] font-medium md:inline">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/70 text-muted-foreground sm:hidden"
              aria-label="Search the site"
            >
              <Search className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
            </button>
            <ThemeToggle />
            {/* Below xl the main nav collapses, so the CTA fits; at xl+ the full nav needs the room. */}
            <Link
              href={hireUsNav.href}
              data-track="consultation_click"
              data-track-location="header"
              aria-current={pathname === hireUsNav.href ? "page" : undefined}
              className="hidden h-10 items-center whitespace-nowrap rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgb(109_74_255/0.7)] transition-[background-color,transform] hover:-translate-y-px hover:bg-primary-hover sm:inline-flex xl:hidden dark:text-primary-foreground"
            >
              {hireUsNav.label}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/70 text-foreground transition-colors hover:border-primary/40 xl:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} pathname={pathname} />
      <SearchDialog index={searchIndex} open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function DropdownNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  // Close if the page holding this menu is hidden by a navigation.
  useLayoutEffect(() => () => setOpen(false), []);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <li
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {active && (
          <m.span
            layoutId="nav-active-pill"
            className="absolute inset-0 -z-10 rounded-lg bg-surface-muted"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        {item.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-full z-50 w-[22rem] -translate-x-1/2 pt-3"
          >
            <ul className="rounded-2xl border border-border bg-surface-elevated p-2 shadow-lift">
              {item.children?.map((child) => (
                <li key={child.href + child.label}>
                  <Link
                    href={child.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-surface-muted"
                  >
                    {child.icon && (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-transform duration-200 group-hover:scale-105">
                        <Icon name={child.icon} className="h-4 w-4" />
                      </span>
                    )}
                    <span>
                      <span className="block text-sm font-medium text-foreground">{child.label}</span>
                      {child.description && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{child.description}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  );
}
