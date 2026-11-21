import { cn } from "@/lib/utils";

/**
 * Decorative animated backdrop: a faded grid, slowly drifting colour orbs and
 * a shifting gradient wash. Pure CSS (transform/opacity only) so it costs no
 * JavaScript and pauses automatically under prefers-reduced-motion.
 */
export function AmbientBackground({ className, intensity = "normal" }: { className?: string; intensity?: "normal" | "subtle" }) {
  const subtle = intensity === "subtle";
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div
        className={cn(
          "absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full blur-3xl",
          subtle ? "opacity-25 dark:opacity-30" : "opacity-40 dark:opacity-50",
        )}
        style={{
          background: "radial-gradient(closest-side, rgb(109 74 255 / 0.55), rgb(47 107 255 / 0.25), transparent)",
        }}
      />
      <div
        className="absolute left-[8%] top-24 h-56 w-56 animate-float-slow rounded-full bg-primary/20 blur-3xl dark:bg-primary/25"
        style={{ animationDelay: "-3s" }}
      />
      <div className="absolute right-[6%] top-48 h-64 w-64 animate-float-slow rounded-full bg-accent/20 blur-3xl dark:bg-accent/20" />
      {!subtle && (
        <div
          className="absolute bottom-0 left-1/3 h-48 w-48 animate-float-slow rounded-full bg-cyan-400/15 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
      )}
    </div>
  );
}
