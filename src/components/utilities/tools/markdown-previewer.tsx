"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { markdownToHtml } from "@/lib/text-tools";
import { ClearButton, CopyButton, ExampleChips, ToolPanel, ToolTextarea } from "../tool-ui";
import type { ToolProps } from "./types";

export default function MarkdownPreviewer({ examples }: ToolProps) {
  const [markdown, setMarkdown] = useState(examples[0]?.input ?? "");
  const deferred = useDeferredValue(markdown);
  // markdownToHtml escapes all input and only emits a fixed set of tags, so the output is safe to inject.
  const html = useMemo(() => markdownToHtml(deferred), [deferred]);

  return (
    <div className="space-y-5">
      <ExampleChips examples={examples} onSelect={setMarkdown} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolPanel
          title="Markdown"
          actions={<><CopyButton text={markdown} label="Copy MD" /><ClearButton onClick={() => setMarkdown("")} disabled={!markdown} /></>}
        >
          <ToolTextarea value={markdown} onChange={setMarkdown} label="Markdown input" placeholder="# Start writing Markdown…" rows={22} mono />
        </ToolPanel>
        <ToolPanel title="Preview" actions={<CopyButton text={html} label="Copy HTML" />}>
          {html ? (
            <div className="prose-content max-h-[38rem] overflow-auto px-5 py-4 text-[0.95rem]" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="p-5 text-sm text-muted-foreground">The rendered preview appears here.</p>
          )}
        </ToolPanel>
      </div>
    </div>
  );
}
