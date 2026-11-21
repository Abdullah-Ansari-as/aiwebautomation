"use client";

import { Moon, Sun } from "lucide-react";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Toggles between light and dark. Icon visibility is driven purely by the
 * `.dark` class, so there is no hydration mismatch and no flash.
 */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => applyTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface/70 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground active:scale-95",
        className,
      )}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <Sun className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-transform duration-500 dark:rotate-0 dark:scale-100" aria-hidden="true" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-transform duration-500 dark:-rotate-90 dark:scale-0" aria-hidden="true" />
    </button>
  );
}
