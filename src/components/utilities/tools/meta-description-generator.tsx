"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { generateMetaDescriptions, metaLengthStatus } from "@/lib/text-tools";
import { cn } from "@/lib/utils";
import {
  ClearButton,
  CopyButton,
  ExampleChips,
  FieldLabel,
  inputClass,
  ModeNotice,
  OutputReveal,
  PrimaryAction,
  textareaClass,
  ToolPanel,
} from "../tool-ui";
import type { ToolProps } from "./types";

const statusStyle = {
  "too-short": { label: "Short", className: "bg-warning/10 text-warning" },
  good: { label: "Good length", className: "bg-success/10 text-success" },
  "too-long": { label: "May be truncated", className: "bg-danger/10 text-danger" },
};

export default function MetaDescriptionGenerator({ examples }: ToolProps) {
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [summary, setSummary] = useState("");
  const [cta, setCta] = useState("");
  const [brand, setBrand] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [runId, setRunId] = useState(0);
  const [error, setError] = useState("");

  const generate = (event?: FormEvent) => {
    event?.preventDefault();
    if (!topic.trim() || !summary.trim()) {
      setError("Add a page topic and a short summary.");
      return;
    }
    setError("");
    setResults(generateMetaDescriptions({ topic, keyword, summary, cta, brand }));
    setRunId((n) => n + 1);
  };

  return (
    <div className="space-y-5">
      <ModeNotice>
        <strong>Template-based.</strong> Generates several meta description patterns from your inputs and checks each against the typical
        120–160 character display range.
      </ModeNotice>
      <ExampleChips
        examples={examples}
        onSelect={(v) => {
          const [t = "", k = "", s = ""] = v.split("|");
          setTopic(t);
          setKeyword(k);
          setSummary(s);
          setResults([]);
        }}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolPanel
          title="Page details"
          actions={
            <ClearButton
              onClick={() => {
                setTopic("");
                setKeyword("");
                setSummary("");
                setCta("");
                setBrand("");
                setResults([]);
              }}
              disabled={!topic && !keyword && !summary}
            />
          }
        >
          <form onSubmit={generate} className="space-y-4 p-5" noValidate>
            <div>
              <FieldLabel htmlFor="md-topic" hint="Required">
                Page topic or title
              </FieldLabel>
              <input id="md-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. AI writing tools" className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="md-keyword">Primary keyword</FieldLabel>
              <input id="md-keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. best AI writing tools" className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="md-summary" hint="Required">
                What the page offers
              </FieldLabel>
              <textarea
                id="md-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="e.g. compare features, pricing models and best use cases"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "md-error" : undefined}
                className={textareaClass}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="md-cta">Call to action</FieldLabel>
                <input id="md-cta" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Read the guide" className={inputClass} />
              </div>
              <div>
                <FieldLabel htmlFor="md-brand">Brand (optional)</FieldLabel>
                <input id="md-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. WebAIAutomation" className={inputClass} />
              </div>
            </div>
            {error && (
              <p id="md-error" role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <PrimaryAction type="submit">Generate descriptions</PrimaryAction>
          </form>
        </ToolPanel>
        <ToolPanel title="Options">
          {results.length ? (
            <OutputReveal id={runId}>
              <ul className="space-y-3 p-5">
                {results.map((r) => {
                  const status = statusStyle[metaLengthStatus(r.length)];
                  return (
                    <li key={r} className="rounded-xl border border-border p-4">
                      <p className="text-sm leading-relaxed text-foreground">{r}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
                          {r.length} chars · {status.label}
                        </span>
                        <CopyButton text={r} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {results.some((r) => r.length < 120) && (
                <p className="px-5 pb-5 text-xs text-muted-foreground">
                  Tip: short options can be strengthened by adding a specific benefit or detail to the summary.
                </p>
              )}
            </OutputReveal>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center p-5 text-center text-sm text-muted-foreground">
              <Search className="mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
              Meta description options appear here.
            </div>
          )}
        </ToolPanel>
      </div>
    </div>
  );
}
