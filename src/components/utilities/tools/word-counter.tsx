"use client";

import { useMemo, useState } from "react";
import { formatMinutes, textStats, topKeywords } from "@/lib/text-tools";
import { ClearButton, CopyButton, ExampleChips, StatTile, ToolPanel, ToolTextarea } from "../tool-ui";
import type { ToolProps } from "./types";

export default function WordCounter({ examples }: ToolProps) {
  const [text, setText] = useState("");
  const stats = useMemo(() => textStats(text), [text]);
  const keywords = useMemo(() => topKeywords(text, 8), [text]);

  return (
    <div className="space-y-5">
      <ExampleChips examples={examples} onSelect={setText} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
        <StatTile label="Words" value={stats.words} />
        <StatTile label="Characters" value={stats.characters} />
        <StatTile label="Sentences" value={stats.sentences} />
        <StatTile label="Paragraphs" value={stats.paragraphs} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <ToolPanel title="Text" actions={<><CopyButton text={text} /><ClearButton onClick={() => setText("")} disabled={!text} /></>}>
          <ToolTextarea value={text} onChange={setText} label="Text to count" placeholder="Start typing or paste your text…" rows={16} />
        </ToolPanel>
        <div className="space-y-5">
          <ToolPanel title="Details">
            <dl className="divide-y divide-border text-sm">
              {[
                ["Characters (no spaces)", stats.charactersNoSpaces],
                ["Reading time", formatMinutes(stats.readingMinutes)],
                ["Speaking time", formatMinutes(stats.speakingMinutes)],
                ["Avg. words / sentence", stats.avgWordsPerSentence.toFixed(1)],
                ["Lines", stats.lines],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </ToolPanel>
          <ToolPanel title="Top keywords">
            {keywords.length ? (
              <ul className="space-y-3 p-5">
                {keywords.map((k) => (
                  <li key={k.word}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{k.word}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {k.count} · {k.density.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
                        style={{ width: `${Math.min(100, (k.count / keywords[0].count) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">Keywords appear as you type.</p>
            )}
          </ToolPanel>
        </div>
      </div>
    </div>
  );
}
