"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { processJson, type JsonResult } from "@/lib/text-tools";
import { ClearButton, CopyButton, ExampleChips, OutputReveal, PrimaryAction, ToolPanel, ToolTextarea } from "../tool-ui";
import type { ToolProps } from "./types";

export default function JsonFormatter({ examples }: ToolProps) {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<"2" | "4" | "tab">("2");
  const [result, setResult] = useState<JsonResult | null>(null);
  const [runId, setRunId] = useState(0);

  const run = (mode: "format" | "minify", source = input) => {
    setResult(processJson(source, mode, indent === "tab" ? "\t" : Number(indent)));
    setRunId((n) => n + 1);
  };

  return (
    <div className="space-y-5">
      <ExampleChips
        examples={examples}
        onSelect={(v) => {
          setInput(v);
          run("format", v);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryAction onClick={() => run("format")} disabled={!input.trim()}>
          Format / Validate
        </PrimaryAction>
        <button
          type="button"
          onClick={() => run("minify")}
          disabled={!input.trim()}
          className="inline-flex h-11 items-center rounded-xl border border-border-strong bg-surface px-5 text-sm font-medium text-foreground transition-all hover:border-primary/40 active:scale-[0.97] disabled:opacity-50"
        >
          Minify
        </button>
        <label className="flex items-center gap-2 text-sm text-foreground">
          Indent
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value as "2" | "4" | "tab")}
            className="h-11 rounded-xl border border-border-strong bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolPanel title="Input JSON" actions={<ClearButton onClick={() => { setInput(""); setResult(null); }} disabled={!input} />}>
          <ToolTextarea value={input} onChange={setInput} label="JSON input" placeholder='{"paste": "your JSON here"}' rows={18} mono />
        </ToolPanel>
        <ToolPanel title="Result" actions={<CopyButton text={result?.ok ? result.output : ""} />}>
          {result ? (
            <OutputReveal id={runId}>
              {result.ok ? (
                <div>
                  <p className="flex items-center gap-2 border-b border-border bg-success/10 px-5 py-2.5 text-sm text-success">
                    <CircleCheck className="h-4 w-4" aria-hidden="true" /> Valid JSON · {result.keys} keys · depth {result.depth} ·{" "}
                    {new TextEncoder().encode(result.output).length} bytes
                  </p>
                  <pre className="max-h-[32rem] overflow-auto px-5 py-4 font-mono text-[0.85rem] leading-relaxed text-foreground">{result.output}</pre>
                </div>
              ) : (
                <div role="alert" className="m-5 rounded-xl border border-danger/30 bg-danger/10 p-4">
                  <p className="flex items-center gap-2 font-semibold text-danger">
                    <TriangleAlert className="h-4 w-4" aria-hidden="true" /> Invalid JSON
                  </p>
                  <p className="mt-2 text-sm text-foreground">{result.error}</p>
                  {result.line !== undefined && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Line {result.line}, column {result.column}
                    </p>
                  )}
                </div>
              )}
            </OutputReveal>
          ) : (
            <p className="p-5 text-sm text-muted-foreground">Formatted output and validation results appear here.</p>
          )}
        </ToolPanel>
      </div>
    </div>
  );
}
