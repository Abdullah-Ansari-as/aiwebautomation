"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { Skeleton } from "@/components/shared/skeleton";
import type { UtilitySlug } from "@/types";
import type { ToolProps } from "./tools/types";

function ToolSkeleton() {
  return (
    <div role="status" aria-label="Loading tool" className="space-y-5">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-[var(--radius-card)]" />
        <Skeleton className="h-80 rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}


/** Each utility is code-split so a page only downloads the tool it shows. */
const registry: Record<UtilitySlug, ComponentType<ToolProps>> = {
  "text-summarizer": dynamic(() => import("./tools/text-summarizer"), { loading: ToolSkeleton }),
  "ai-email-writer": dynamic(() => import("./tools/ai-email-writer"), { loading: ToolSkeleton }),
  "prompt-generator": dynamic(() => import("./tools/prompt-generator"), { loading: ToolSkeleton }),
  "word-counter": dynamic(() => import("./tools/word-counter"), { loading: ToolSkeleton }),
  "character-counter": dynamic(() => import("./tools/character-counter"), { loading: ToolSkeleton }),
  "case-converter": dynamic(() => import("./tools/case-converter"), { loading: ToolSkeleton }),
  "json-formatter": dynamic(() => import("./tools/json-formatter"), { loading: ToolSkeleton }),
  "markdown-previewer": dynamic(() => import("./tools/markdown-previewer"), { loading: ToolSkeleton }),
  "meta-description-generator": dynamic(() => import("./tools/meta-description-generator"), { loading: ToolSkeleton }),
};

export function UtilityRenderer({ slug, examples }: { slug: UtilitySlug } & ToolProps) {
  const Tool = registry[slug];
  return <Tool examples={examples} />;
}
