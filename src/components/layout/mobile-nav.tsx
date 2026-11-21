"use client";

import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { hireUsNav, mainNav } from "@/data/navigation";
import { socialLinks } from "@/data/site";
import { cn } from "@/lib/utils";
import { SocialIcon } from "@/components/shared/social-icons";
import { Logo } from "./logo";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // Keep focus inside the drawer.
      if (event.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>("a, button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("button")?.focus(), 50);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  const links = mainNav.flatMap((item) =>
    item.children ? [item, ...item.children.filter((c) => c.href !== item.href)] : [item],
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <m.div
            className="absolute inset-0 bg-[#050816]/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <m.div
            ref={panelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col border-l border-border bg-surface shadow-lift"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
              <m.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.035, delayChildren: 0.08 } } }}
                className="space-y-1"
              >
                {links.map((item) => {
                  const active = isActive(pathname, item.href);
                  const isChild = !mainNav.some((n) => n.href === item.href && n.label === item.label);
                  return (
                    <m.li
                      key={item.href + item.label}
                      variants={{ hidden: { opacity: 0, x: 16 }, show: { opacity: 1, x: 0 } }}
                    >
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center rounded-xl px-4 py-3 text-[0.95rem] font-medium transition-colors",
                          isChild && "ml-4 py-2.5 text-sm",
                          active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-surface-muted",
                        )}
                      >
                        {item.label}
                      </Link>
                    </m.li>
                  );
                })}
              </m.ul>
              <Link
                href={hireUsNav.href}
                onClick={onClose}
                data-track="consultation_click"
                data-track-location="mobile-nav"
                className="mt-4 flex flex-col rounded-xl bg-primary px-4 py-3 text-white dark:text-primary-foreground"
              >
                <span className="text-[0.95rem] font-semibold">{hireUsNav.label}</span>
                <span className="text-xs opacity-85">{hireUsNav.description}</span>
              </Link>
            </nav>
            <div className="flex items-center gap-2 border-t border-border px-5 py-4">
              {socialLinks.map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
