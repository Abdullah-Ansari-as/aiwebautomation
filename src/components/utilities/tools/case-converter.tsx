"use client";

import { m } from "framer-motion";
import { useMemo, useState } from "react";
import { convertCase, type CaseType } from "@/lib/text-tools";
import { cn } from "@/lib/utils";
import { ClearButton, CopyButton, ExampleChips, ToolPanel, ToolTextarea } from "../tool-ui";
import type { ToolProps } from "./types";

const CASES: { id: CaseType; label: string }[] = [
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence case" },
  { id: "upper", label: "UPPERCASE" },
  { id: "lower", label: "lowercase" },
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
  { id: "constant", label: "CONSTANT_CASE" },
  { id: "alternating", label: "aLtErNaTiNg" },
];

export default function CaseConverter({ examples }: ToolProps) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseType>("title");
  const output = useMemo(() => convertCase(text, mode), [text, mode]);

  return (
    <div className="space-y-5">
      <ExampleChips examples={examples} onSelect={setText} />
      <div role="radiogroup" aria-label="Target case" className="flex flex-wrap gap-2">
        {CASES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={mode === c.id}
            onClick={() => setMode(c.id)}
            className={cn(
              "relative rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
              mode === c.id ? "border-primary text-white dark:text-primary-foreground" : "border-border bg-surface text-foreground hover:border-primary/40",
            )}
          >
            {mode === c.id && <m.span layoutId="case-pill" className="absolute inset-0 rounded-[0.7rem] bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{c.label}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolPanel title="Input" actions={<ClearButton onClick={() => setText("")} disabled={!text} />}>
          <ToolTextarea value={text} onChange={setText} label="Text to convert" placeholder="Paste or type text…" rows={12} />
        </ToolPanel>
        <ToolPanel title={`Output — ${CASES.find((c) => c.id === mode)?.label}`} actions={<CopyButton text={output} />}>
          <ToolTextarea value={output} label="Converted text" readOnly rows={12} placeholder="Converted text appears here." />
        </ToolPanel>
      </div>
    </div>
  );
}
