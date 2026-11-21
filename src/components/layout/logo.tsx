import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c5cff" />
          <stop offset="1" stopColor="#2f6bff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-gradient)" />
      <path
        d="M7.5 10.5 11 22l3.2-8 1.8 4.6L17.8 14l3.2 8 3.5-11.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.5" cy="10.5" r="1.8" fill="#fff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5 font-semibold tracking-tight text-foreground", className)}
      aria-label="WebAIAutomation home"
    >
      <LogoMark className="transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105" />
      <span className="text-[1.05rem]">
        WebAI<span className="text-gradient">Automation</span>
      </span>
    </Link>
  );
}
