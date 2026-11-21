"use client";

import { useMemo, useState } from "react";
import { textStats } from "@/lib/text-tools";
import { cn } from "@/lib/utils";
import { ClearButton, CopyButton, ExampleChips, StatTile, ToolPanel, ToolTextarea } from "../tool-ui";
import type { ToolProps } from "./types";

/** Common guideline limits — platforms change these, so we label them as guidance. */
const LIMITS = [
  { label: "SEO title", limit: 60 },
  { label: "Meta description", limit: 160 },
  { label: "SMS message", limit: 160 },
  { label: "X (Twitter) post", limit: 280 },
  { label: "Instagram caption", limit: 2200 },
  { label: "LinkedIn post", limit: 3000 },
];

export default function CharacterCounter({ examples }: ToolProps) {
  const [text, setText] = useState("");
  const stats = useMemo(() => textStats(text), [text]);

  return (
    <div className="space-y-5">
      <ExampleChips examples={examples} onSelect={setText} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
        <StatTile label="Characters" value={stats.characters} />
        <StatTile label="Without spaces" value={stats.charactersNoSpaces} />
        <StatTile label="Words" value={stats.words} />
        <StatTile label="Bytes (UTF-8)" value={stats.bytes} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <ToolPanel title="Text" actions={<><CopyButton text={text} /><ClearButton onClick={() => setText("")} disabled={!text} /></>}>
          <ToolTextarea value={text} onChange={setText} label="Text to count" placeholder="Type or paste text to count characters…" rows={12} />
        </ToolPanel>
        <ToolPanel title="Common limits" footer="Guideline limits — platforms may change them or truncate differently.">
          <ul className="space-y-4 p-5">
            {LIMITS.map(({ label, limit }) => {
              const pct = Math.min(100, (stats.characters / limit) * 100);
              const over = stats.characters > limit;
              return (
                <li key={label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{label}</span>
                    <span className={cn("tabular-nums", over ? "font-medium text-danger" : "text-muted-foreground")}>
                      {stats.characters}/{limit}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={cn("h-full rounded-full transition-[width] duration-300", over ? "bg-danger" : pct > 85 ? "bg-warning" : "bg-success")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </ToolPanel>
      </div>
    </div>
  );
}
