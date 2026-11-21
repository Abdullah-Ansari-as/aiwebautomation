"use client";

import { WandSparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { buildPrompt } from "@/lib/text-tools";
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

const ROLES = ["", "an experienced content editor", "a senior software engineer", "a marketing strategist", "a customer support specialist", "a data analyst", "a patient teacher"];
const FORMATS = ["", "a bulleted list", "numbered step-by-step instructions", "a short paragraph", "a table", "an email", "valid JSON"];
const TONES = ["", "professional", "friendly", "persuasive", "neutral and factual", "simple and jargon-free"];

export default function PromptGenerator({ examples }: ToolProps) {
  const [task, setTask] = useState("");
  const [role, setRole] = useState("");
  const [audience, setAudience] = useState("");
  const [context, setContext] = useState("");
  const [format, setFormat] = useState("");
  const [tone, setTone] = useState("");
  const [length, setLength] = useState("");
  const [constraints, setConstraints] = useState("");
  const [askQuestions, setAskQuestions] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [runId, setRunId] = useState(0);
  const [error, setError] = useState("");

  const generate = (event?: FormEvent) => {
    event?.preventDefault();
    if (!task.trim()) {
      setError("Describe the task first.");
      return;
    }
    setError("");
    setPrompt(buildPrompt({ task, role, audience, context, format, tone, length, constraints, askQuestions, includeExamples }));
    setRunId((n) => n + 1);
  };

  const clear = () => {
    setTask("");
    setRole("");
    setAudience("");
    setContext("");
    setFormat("");
    setTone("");
    setLength("");
    setConstraints("");
    setPrompt("");
  };

  const select = (id: string, label: string, value: string, set: (v: string) => void, options: string[]) => (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select id={id} value={value} onChange={(e) => set(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o ? o.charAt(0).toUpperCase() + o.slice(1) : "Not specified"}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      <ModeNotice>
        <strong>Template-based.</strong> Builds a structured prompt from your inputs using a proven role → task → context → requirements
        pattern. Paste the result into any AI assistant.
      </ModeNotice>
      <ExampleChips examples={examples} onSelect={setTask} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolPanel title="Prompt details" actions={<ClearButton onClick={clear} disabled={!task && !context && !constraints} />}>
          <form onSubmit={generate} className="space-y-4 p-5" noValidate>
            <div>
              <FieldLabel htmlFor="pg-task" hint="Required">
                Task
              </FieldLabel>
              <textarea
                id="pg-task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                placeholder="What should the AI do?"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "pg-task-error" : undefined}
                className={textareaClass}
              />
              {error && (
                <p id="pg-task-error" role="alert" className="mt-1.5 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {select("pg-role", "Role", role, setRole, ROLES)}
              <div>
                <FieldLabel htmlFor="pg-audience">Audience</FieldLabel>
                <input id="pg-audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. small business owners" className={inputClass} />
              </div>
              {select("pg-format", "Output format", format, setFormat, FORMATS)}
              {select("pg-tone", "Tone", tone, setTone, TONES)}
            </div>
            <div>
              <FieldLabel htmlFor="pg-context">Context</FieldLabel>
              <textarea id="pg-context" value={context} onChange={(e) => setContext(e.target.value)} rows={3} placeholder="Background, goals, or source material the AI should use" className={textareaClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="pg-length">Length</FieldLabel>
                <input id="pg-length" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. under 200 words" className={inputClass} />
              </div>
              <div>
                <FieldLabel htmlFor="pg-constraints" hint="One per line">
                  Constraints
                </FieldLabel>
                <textarea id="pg-constraints" value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={2} placeholder="Avoid jargon" className={textareaClass} />
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm text-foreground">
              <label className="flex items-center gap-2.5">
                <input type="checkbox" checked={askQuestions} onChange={(e) => setAskQuestions(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                Ask clarifying questions first
              </label>
              <label className="flex items-center gap-2.5">
                <input type="checkbox" checked={includeExamples} onChange={(e) => setIncludeExamples(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                Ask for concrete examples
              </label>
            </div>
            <PrimaryAction type="submit">Generate prompt</PrimaryAction>
          </form>
        </ToolPanel>
        <ToolPanel title="Your prompt" actions={<CopyButton text={prompt} />}>
          {prompt ? (
            <OutputReveal id={runId}>
              <pre className="whitespace-pre-wrap p-5 font-mono text-[0.85rem] leading-relaxed text-foreground">{prompt}</pre>
            </OutputReveal>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center p-5 text-center text-sm text-muted-foreground">
              <WandSparkles className="mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
              Your structured prompt will appear here.
            </div>
          )}
        </ToolPanel>
      </div>
    </div>
  );
}
