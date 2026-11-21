"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { summarize, type SummaryResult } from "@/lib/text-tools";
import { ClearButton, CopyButton, ExampleChips, ModeNotice, OutputReveal, PrimaryAction, StatTile, ToolPanel, ToolTextarea } from "../tool-ui";
import type { ToolProps } from "./types";

export default function TextSummarizer({ examples }: ToolProps) {
  const [input, setInput] = useState("");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [runId, setRunId] = useState(0);

  const sentenceTotal = input.trim() ? input.split(/[.!?]+\s/).length : 0;
  const run = () => {
    setResult(summarize(input, count));
    setRunId((n) => n + 1);
  };
  const output = result?.sentences.join(" ") ?? "";

  return (
    <div className="space-y-5">
      <ModeNotice>
        <strong>Runs in your browser.</strong> This version creates an <em>extractive</em> summary by selecting your text&apos;s most
        informative sentences. AI-written (abstractive) summaries will be added once a secure API is connected.
      </ModeNotice>
      <ExampleChips examples={examples} onSelect={(v) => { setInput(v); setResult(null); }} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolPanel
          title="Your text"
          actions={<ClearButton onClick={() => { setInput(""); setResult(null); }} disabled={!input} />}
          footer={`${input.trim() ? input.trim().split(/\s+/).length : 0} words`}
        >
          <ToolTextarea value={input} onChange={setInput} label="Text to summarize" placeholder="Paste an article, report or long email (at least 3–4 sentences)…" rows={14} />
        </ToolPanel>
        <ToolPanel title="Summary" actions={<CopyButton text={output} />}>
          <div className="p-5">
            {result ? (
              <OutputReveal id={runId}>
                <p className="leading-relaxed text-foreground">{output}</p>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <StatTile label="Original words" value={result.originalWords} />
                  <StatTile label="Summary words" value={result.summaryWords} />
                  <StatTile
                    label="Reduced by"
                    value={`${result.originalWords ? Math.round((1 - result.summaryWords / result.originalWords) * 100) : 0}%`}
                  />
                </div>
              </OutputReveal>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <FileText className="mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
                Your summary will appear here.
              </div>
            )}
          </div>
        </ToolPanel>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-sm text-foreground">
          Sentences in summary
          <input
            type="range"
            min={1}
            max={8}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="accent-[var(--primary)]"
            aria-valuetext={`${count} sentences`}
          />
          <span className="w-4 font-semibold tabular-nums">{count}</span>
        </label>
        <PrimaryAction onClick={run} disabled={sentenceTotal < 2}>
          Summarize
        </PrimaryAction>
        {input && sentenceTotal < 2 && <span className="text-xs text-muted-foreground">Add at least two sentences.</span>}
      </div>
    </div>
  );
}
