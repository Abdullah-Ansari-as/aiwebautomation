import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ContentBlock, ContentSection } from "@/types";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";

const calloutStyles = {
  info: { icon: Info, className: "border-accent/25 bg-accent-soft/60", iconClass: "text-accent" },
  tip: { icon: Lightbulb, className: "border-primary/25 bg-primary-soft/60", iconClass: "text-primary" },
  warning: { icon: TriangleAlert, className: "border-warning/30 bg-warning/10", iconClass: "text-warning" },
} as const;

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <RichText text={block.text} />
        </p>
      );
    case "h3":
      return (
        <h3>
          <RichText text={block.text} />
        </h3>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List>
          {block.items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </List>
      );
    }
    case "quote":
      return (
        <blockquote>
          <p>
            <RichText text={block.text} />
          </p>
          {block.cite && <footer className="mt-2 text-sm not-italic">— {block.cite}</footer>}
        </blockquote>
      );
    case "callout": {
      const style = calloutStyles[block.tone ?? "info"];
      const CalloutIcon = style.icon;
      return (
        <aside className={cn("flex gap-3 rounded-2xl border p-5 text-[0.98rem] leading-relaxed", style.className)}>
          <CalloutIcon className={cn("mt-1 h-5 w-5 shrink-0", style.iconClass)} aria-hidden="true" />
          <div>
            {block.title && <p className="mb-1 font-semibold text-foreground">{block.title}</p>}
            <p>
              <RichText text={block.text} />
            </p>
          </div>
        </aside>
      );
    }
    case "code":
      return (
        <figure>
          <figcaption className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {block.language}
          </figcaption>
          <pre>
            <code>{block.code}</code>
          </pre>
        </figure>
      );
  }
}

/** Renders structured article/guide content with semantic headings. */
export function ContentRenderer({ intro, sections }: { intro: string; sections: ContentSection[] }) {
  return (
    <div className="prose-content">
      <p className="text-lg leading-relaxed text-foreground/90">
        <RichText text={intro} />
      </p>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id}>
          <h2 id={section.id}>{section.heading}</h2>
          {section.blocks.map((block, i) => (
            <div key={i} className="mt-5">
              <Block block={block} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
