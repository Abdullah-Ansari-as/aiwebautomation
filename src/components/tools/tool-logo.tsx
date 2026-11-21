import { cn } from "@/lib/utils";
import type { AITool } from "@/types";

function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 1).toUpperCase();
}

const sizes = {
  sm: "h-10 w-10 rounded-xl text-sm",
  md: "h-12 w-12 rounded-[0.9rem] text-base",
  lg: "h-16 w-16 rounded-2xl text-xl",
  xl: "h-20 w-20 rounded-[1.4rem] text-2xl",
};

/**
 * Generated monogram "visual identity" for a tool. We intentionally don't
 * reproduce third-party logos; colours are loosely inspired by each brand.
 */
export function ToolLogo({
  tool,
  size = "md",
  className,
}: {
  tool: Pick<AITool, "name" | "brandColors">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [from, to] = tool.brandColors;
  return (
    <span
      role="img"
      aria-label={`${tool.name} monogram`}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold tracking-tight text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-10px_rgb(0_0_0/0.5)]",
        sizes[size],
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_55%)]" />
      <span aria-hidden="true" className="relative drop-shadow-sm">
        {initials(tool.name)}
      </span>
    </span>
  );
}
