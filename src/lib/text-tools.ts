/**
 * Pure, dependency-free text utilities that power the free on-site tools.
 * Everything runs in the browser; nothing is sent to a server.
 */

export const STOPWORDS = new Set(
  (
    "a about above after again against all am an and any are as at be because been before being below between both but by can " +
    "could did do does doing down during each few for from further had has have having he her here hers herself him himself his how " +
    "i if in into is it its itself just let me more most my myself no nor not now of off on once only or other our ours ourselves out " +
    "over own same she should so some such than that the their theirs them themselves then there these they this those through to too " +
    "under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves also " +
    "may might must shall us via per etc using use used one two get got make makes made like new many much"
  ).split(" "),
);

/* ------------------------------------------------------------------ */
/* Tokenising                                                          */
/* ------------------------------------------------------------------ */

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+(?=["'“‘(\[]?[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function words(text: string): string[] {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
}

/* ------------------------------------------------------------------ */
/* Word & character statistics                                         */
/* ------------------------------------------------------------------ */

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  bytes: number;
  readingMinutes: number;
  speakingMinutes: number;
  avgWordsPerSentence: number;
}

export function textStats(text: string): TextStats {
  const wordList = words(text);
  const sentences = text.trim() ? splitSentences(text).length : 0;
  return {
    words: wordList.length,
    characters: [...text].length,
    charactersNoSpaces: [...text.replace(/\s/g, "")].length,
    sentences,
    paragraphs: text.trim() ? text.trim().split(/\n\s*\n/).length : 0,
    lines: text ? text.split("\n").length : 0,
    bytes: new TextEncoder().encode(text).length,
    readingMinutes: wordList.length / 225,
    speakingMinutes: wordList.length / 140,
    avgWordsPerSentence: sentences ? wordList.length / sentences : 0,
  };
}

export function formatMinutes(minutes: number): string {
  if (minutes === 0) return "0 sec";
  if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} sec`;
  const whole = Math.floor(minutes);
  const sec = Math.round((minutes - whole) * 60);
  return sec ? `${whole} min ${sec} sec` : `${whole} min`;
}

export function topKeywords(text: string, limit = 8): { word: string; count: number; density: number }[] {
  const list = words(text.toLowerCase());
  const counts = new Map<string, number>();
  for (const w of list) {
    if (w.length < 3 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, density: list.length ? (count / list.length) * 100 : 0 }));
}

/* ------------------------------------------------------------------ */
/* Extractive summariser                                               */
/* ------------------------------------------------------------------ */

export interface SummaryResult {
  sentences: string[];
  originalWords: number;
  summaryWords: number;
  totalSentences: number;
}

/**
 * Frequency-based extractive summary: each sentence is scored by the
 * normalised frequency of its non-stopword terms (lightly length-normalised,
 * with a small boost for the opening sentence). The top sentences are
 * returned in their original order.
 */
export function summarize(text: string, sentenceCount: number): SummaryResult {
  const sentences = splitSentences(text);
  const allWords = words(text.toLowerCase()).filter((w) => !STOPWORDS.has(w) && w.length > 2);
  const freq = new Map<string, number>();
  for (const w of allWords) freq.set(w, (freq.get(w) ?? 0) + 1);
  const max = Math.max(1, ...freq.values());

  const scored = sentences.map((sentence, index) => {
    const terms = words(sentence.toLowerCase()).filter((w) => !STOPWORDS.has(w) && w.length > 2);
    const raw = terms.reduce((sum, w) => sum + (freq.get(w) ?? 0) / max, 0);
    const lengthNorm = terms.length ? raw / Math.pow(terms.length, 0.6) : 0;
    const positionBoost = index === 0 ? 1.15 : 1;
    return { sentence, index, score: lengthNorm * positionBoost };
  });

  const count = Math.min(Math.max(1, sentenceCount), sentences.length);
  const picked = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  return {
    sentences: picked,
    originalWords: words(text).length,
    summaryWords: words(picked.join(" ")).length,
    totalSentences: sentences.length,
  };
}

/* ------------------------------------------------------------------ */
/* Case conversion                                                     */
/* ------------------------------------------------------------------ */

export type CaseType =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "alternating";

const SMALL_WORDS = new Set("a an and as at but by for in nor of on or per the to vs via with".split(" "));

/** Keeps short all-caps words such as "AI", "SEO" or "JSON" intact. */
function looksLikeAcronym(word: string): boolean {
  const core = word.replace(/[^\p{L}\p{N}]/gu, "");
  return core.length >= 2 && core.length <= 5 && /^[\p{Lu}\p{N}]+$/u.test(core) && /\p{Lu}/u.test(core);
}

function identifierWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function convertCase(text: string, type: CaseType): string {
  // Only preserve acronyms when the text isn't entirely upper case.
  const keepAcronyms = text !== text.toUpperCase();
  const isAcronym = (word: string) => keepAcronyms && looksLikeAcronym(word);
  switch (type) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/[^\n]+/g, (line) => {
        const parts = line.split(/(\s+)/);
        const wordIdx = parts.map((p, i) => (/\S/.test(p) ? i : -1)).filter((i) => i >= 0);
        const first = wordIdx[0];
        const last = wordIdx[wordIdx.length - 1];
        return parts
          .map((p, i) => {
            if (!/\S/.test(p)) return p;
            if (isAcronym(p)) return p;
            const lower = p.toLowerCase();
            if (i !== first && i !== last && SMALL_WORDS.has(lower)) return lower;
            return lower.charAt(0).toUpperCase() + lower.slice(1);
          })
          .join("");
      });
    case "sentence":
      return text
        .split(/(\s+)/)
        .map((p) => (isAcronym(p) ? p : p.toLowerCase()))
        .join("")
        .replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (_m, pre: string, ch: string) => pre + ch.toUpperCase());
    case "camel": {
      const w = identifierWords(text);
      return w.map((x, i) => (i === 0 ? x : x.charAt(0).toUpperCase() + x.slice(1))).join("");
    }
    case "pascal":
      return identifierWords(text)
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
        .join("");
    case "snake":
      return identifierWords(text).join("_");
    case "kebab":
      return identifierWords(text).join("-");
    case "constant":
      return identifierWords(text).join("_").toUpperCase();
    case "alternating": {
      let i = 0;
      return [...text]
        .map((ch) => {
          if (!/\p{L}/u.test(ch)) return ch;
          return i++ % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase();
        })
        .join("");
    }
  }
}

/* ------------------------------------------------------------------ */
/* JSON                                                                */
/* ------------------------------------------------------------------ */

export type JsonResult =
  | { ok: true; output: string; keys: number; depth: number }
  | { ok: false; error: string; line?: number; column?: number };

function measure(value: unknown, depth = 1): { keys: number; depth: number } {
  if (value === null || typeof value !== "object") return { keys: 0, depth: depth - 1 };
  const children = Array.isArray(value) ? value : Object.values(value);
  let keys = Array.isArray(value) ? 0 : children.length;
  let maxDepth = depth;
  for (const child of children) {
    const m = measure(child, depth + 1);
    keys += m.keys;
    maxDepth = Math.max(maxDepth, m.depth);
  }
  return { keys, depth: maxDepth };
}

/**
 * Minimal JSON scanner used only to locate syntax errors precisely, because
 * modern engines don't always include a position in JSON.parse errors.
 */
function locateJsonError(source: string): { index: number; message: string } | null {
  let i = 0;
  class JsonSyntaxError {
    index: number;
    message: string;
    constructor(index: number, message: string) {
      this.index = index;
      this.message = message;
    }
  }
  const fail = (message: string): never => {
    throw new JsonSyntaxError(i, message);
  };
  const ws = () => {
    while (i < source.length && /\s/.test(source[i])) i++;
  };
  const str = () => {
    i++;
    while (i < source.length) {
      const ch = source[i];
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === '"') {
        i++;
        return;
      }
      if (ch === "\n") fail("Unterminated string (line break inside a string)");
      i++;
    }
    fail("Unterminated string");
  };
  const value = (): void => {
    ws();
    const c = source[i];
    if (c === "{") {
      i++;
      ws();
      if (source[i] === "}") {
        i++;
        return;
      }
      for (;;) {
        ws();
        if (source[i] !== '"') fail(source[i] === "'" ? "Property names must use double quotes" : "Expected a double-quoted property name");
        str();
        ws();
        if (source[i] !== ":") fail("Expected ':' after property name");
        i++;
        value();
        ws();
        if (source[i] === ",") {
          i++;
          ws();
          if (source[i] === "}") fail("Trailing comma before '}'");
          continue;
        }
        if (source[i] === "}") {
          i++;
          return;
        }
        fail("Expected ',' or '}' after property value");
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (source[i] === "]") {
        i++;
        return;
      }
      for (;;) {
        value();
        ws();
        if (source[i] === ",") {
          i++;
          ws();
          if (source[i] === "]") fail("Trailing comma before ']'");
          continue;
        }
        if (source[i] === "]") {
          i++;
          return;
        }
        fail("Expected ',' or ']' after array item");
      }
    }
    if (c === '"') return str();
    if (c === "-" || (c !== undefined && /\d/.test(c))) {
      const match = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(source.slice(i));
      if (!match) fail("Invalid number");
      i += match![0].length;
      return;
    }
    for (const literal of ["true", "false", "null"]) {
      if (source.startsWith(literal, i)) {
        i += literal.length;
        return;
      }
    }
    if (c === "'") fail("Strings must use double quotes");
    fail(c === undefined ? "Unexpected end of input" : `Unexpected character '${c}'`);
  };
  try {
    value();
    ws();
    if (i < source.length) fail("Unexpected content after the JSON value");
    return null;
  } catch (error) {
    if (error instanceof JsonSyntaxError) return { index: error.index, message: error.message };
    return null;
  }
}

export function processJson(input: string, mode: "format" | "minify", indent: number | "\t" = 2): JsonResult {
  if (!input.trim()) return { ok: false, error: "Paste some JSON to get started." };
  try {
    const parsed: unknown = JSON.parse(input);
    const output = mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
    return { ok: true, output, ...measure(parsed) };
  } catch (error) {
    const located = locateJsonError(input);
    if (located) {
      const before = input.slice(0, located.index);
      const line = before.split("\n").length;
      const column = before.length - before.lastIndexOf("\n");
      return { ok: false, error: located.message, line, column };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON" };
  }
}

/* ------------------------------------------------------------------ */
/* Markdown (safe subset)                                              */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed) || /^[/#.]/.test(trimmed)) return trimmed;
  return null;
}

function inlineMarkdown(escaped: string): string {
  const codeSpans: string[] = [];
  let out = escaped.replace(/`([^`]+)`/g, (_m, code: string) => {
    codeSpans.push(`<code>${code}</code>`);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });
  out = out
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, src: string) => {
      const url = safeUrl(src.replace(/&amp;/g, "&"));
      return url && /^https?:/i.test(url) ? `<img src="${escapeHtml(url)}" alt="${alt}" loading="lazy" />` : alt;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
      const url = safeUrl(href.replace(/&amp;/g, "&"));
      return url ? `<a href="${escapeHtml(url)}" rel="noopener noreferrer" target="_blank">${label}</a>` : label;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^\w])_([^_\s][^_]*)_/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return out.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => codeSpans[Number(i)]);
}

/**
 * Converts a safe Markdown subset to HTML. All input is HTML-escaped first,
 * so raw HTML can never be injected; links are restricted to http(s),
 * mailto and relative URLs.
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = /^```\s*([\w-]*)\s*$/.exec(line);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++;
      const lang = fence[1] ? ` data-language="${escapeHtml(fence[1])}"` : "";
      html.push(`<pre${lang}><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(escapeHtml(heading[2].trim()))}</h${level}>`);
      i++;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      html.push("<hr />");
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""));
      html.push(`<blockquote><p>${inlineMarkdown(escapeHtml(quote.join(" ")))}</p></blockquote>`);
      continue;
    }

    const ordered = /^\s*\d+[.)]\s+/;
    const unordered = /^\s*[-*+]\s+/;
    if (ordered.test(line) || unordered.test(line)) {
      const isOrdered = ordered.test(line);
      const pattern = isOrdered ? ordered : unordered;
      const items: string[] = [];
      while (i < lines.length && pattern.test(lines[i])) {
        let item = lines[i].replace(pattern, "");
        const task = /^\[( |x|X)\]\s+/.exec(item);
        item = inlineMarkdown(escapeHtml(task ? item.slice(task[0].length) : item));
        if (task) item = `<input type="checkbox" disabled${task[1].trim() ? " checked" : ""} /> ${item}`;
        items.push(`<li>${item}</li>`);
        i++;
      }
      const tag = isOrdered ? "ol" : "ul";
      html.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6})\s|^```|^>\s?|^\s*[-*+]\s+|^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i++]);
    }
    html.push(`<p>${paragraph.map((p) => inlineMarkdown(escapeHtml(p))).join("<br />")}</p>`);
  }

  return html.join("\n");
}

/* ------------------------------------------------------------------ */
/* Meta descriptions                                                   */
/* ------------------------------------------------------------------ */

export interface MetaInput {
  topic: string;
  keyword: string;
  summary: string;
  cta?: string;
  brand?: string;
}

export type LengthStatus = "too-short" | "good" | "too-long";

export function metaLengthStatus(length: number): LengthStatus {
  if (length < 120) return "too-short";
  if (length > 160) return "too-long";
  return "good";
}

function sentenceCase(value: string): string {
  const v = value.trim().replace(/[.\s]+$/, "");
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function lowerFirst(value: string): string {
  const v = value.trim().replace(/[.\s]+$/, "");
  return /^[A-Z][a-z]/.test(v) ? v.charAt(0).toLowerCase() + v.slice(1) : v;
}

export function generateMetaDescriptions({ topic, keyword, summary, cta, brand }: MetaInput): string[] {
  const kw = keyword.trim() || topic.trim();
  const sum = lowerFirst(summary);
  const action = cta?.trim() ? sentenceCase(cta) : "Learn more";
  const by = brand?.trim() ? ` with ${brand.trim()}` : "";

  const variants = [
    `${sentenceCase(kw)}: ${sum}. ${action}.`,
    `Looking for ${lowerFirst(kw)}? ${sentenceCase(sum)}${by}. ${action} today.`,
    `${sentenceCase(sum)} — a practical guide to ${lowerFirst(kw)}${by}. ${action}.`,
    `Discover ${lowerFirst(topic || kw)}: ${sum}. Clear, practical and up to date. ${action}.`,
  ];
  return [...new Set(variants.map((v) => v.replace(/\s+/g, " ").replace(/\.\./g, ".").trim()))];
}

/* ------------------------------------------------------------------ */
/* Prompt builder                                                      */
/* ------------------------------------------------------------------ */

export interface PromptInput {
  task: string;
  role?: string;
  audience?: string;
  context?: string;
  format?: string;
  tone?: string;
  length?: string;
  constraints?: string;
  askQuestions?: boolean;
  includeExamples?: boolean;
}

export function buildPrompt(input: PromptInput): string {
  const lines: string[] = [];
  if (input.role?.trim()) lines.push(`You are ${input.role.trim().replace(/^(a|an)\s+/i, (m) => m.toLowerCase())}.`);
  lines.push("", "## Task", input.task.trim());
  if (input.context?.trim()) lines.push("", "## Context", input.context.trim());
  if (input.audience?.trim()) lines.push("", "## Audience", `Write for ${input.audience.trim()}.`);

  const requirements: string[] = [];
  if (input.format?.trim()) requirements.push(`Format: ${input.format.trim()}.`);
  if (input.tone?.trim()) requirements.push(`Tone: ${input.tone.trim()}.`);
  if (input.length?.trim()) requirements.push(`Length: ${input.length.trim()}.`);
  if (input.constraints?.trim()) {
    for (const c of input.constraints.split("\n").map((s) => s.trim()).filter(Boolean)) requirements.push(c.replace(/^[-*]\s*/, ""));
  }
  if (input.includeExamples) requirements.push("Include one or two concrete examples to illustrate key points.");
  requirements.push("If something is uncertain, say so rather than guessing.");
  lines.push("", "## Requirements", ...requirements.map((r) => `- ${r}`));

  if (input.askQuestions) {
    lines.push("", "Before you start, ask me up to three clarifying questions if any part of the task is ambiguous.");
  }
  return lines.join("\n").trim();
}

/* ------------------------------------------------------------------ */
/* Email templates                                                     */
/* ------------------------------------------------------------------ */

export type EmailType = "follow-up" | "meeting-request" | "thank-you" | "introduction" | "request" | "apology";
export type EmailTone = "formal" | "friendly" | "concise";

export interface EmailInput {
  type: EmailType;
  tone: EmailTone;
  recipient: string;
  sender: string;
  topic: string;
  points: string[];
}

const subjects: Record<EmailType, (topic: string) => string> = {
  "follow-up": (t) => `Following up: ${t}`,
  "meeting-request": (t) => `Meeting request: ${t}`,
  "thank-you": (t) => `Thank you — ${t}`,
  introduction: (t) => `Introduction: ${t}`,
  request: (t) => `Request: ${t}`,
  apology: (t) => `Apologies regarding ${t}`,
};

const openings: Record<EmailType, Record<EmailTone, (topic: string) => string>> = {
  "follow-up": {
    formal: (t) => `I am writing to follow up on ${t}.`,
    friendly: (t) => `I wanted to quickly follow up on ${t}.`,
    concise: (t) => `Following up on ${t}.`,
  },
  "meeting-request": {
    formal: (t) => `I would like to request a meeting to discuss ${t}.`,
    friendly: (t) => `Would you be up for a quick meeting to talk through ${t}?`,
    concise: (t) => `Could we meet to discuss ${t}?`,
  },
  "thank-you": {
    formal: (t) => `Thank you for ${t}. I genuinely appreciate it.`,
    friendly: (t) => `Thanks so much for ${t} — it really made a difference.`,
    concise: (t) => `Thank you for ${t}.`,
  },
  introduction: {
    formal: (t) => `I would like to introduce myself regarding ${t}.`,
    friendly: (t) => `I'm reaching out to introduce myself — I'm getting in touch about ${t}.`,
    concise: (t) => `Quick introduction regarding ${t}.`,
  },
  request: {
    formal: (t) => `I am writing to ask for your help with ${t}.`,
    friendly: (t) => `I was hoping you could help me with ${t}.`,
    concise: (t) => `A quick request about ${t}.`,
  },
  apology: {
    formal: (t) => `Please accept my apologies regarding ${t}.`,
    friendly: (t) => `I'm really sorry about ${t}.`,
    concise: (t) => `Apologies for ${t}.`,
  },
};

const closings: Record<EmailType, Record<EmailTone, string>> = {
  "follow-up": {
    formal: "Please let me know if you need any further information. I look forward to hearing from you.",
    friendly: "Let me know if anything else would be helpful — happy to help!",
    concise: "Let me know your thoughts.",
  },
  "meeting-request": {
    formal: "Please let me know a time that suits you, and I will send a calendar invitation.",
    friendly: "Let me know what works for you and I'll send over an invite.",
    concise: "What time works for you?",
  },
  "thank-you": {
    formal: "Thank you again for your time and support.",
    friendly: "Thanks again — I really appreciate it!",
    concise: "Thanks again.",
  },
  introduction: {
    formal: "I would welcome the opportunity to connect at your convenience.",
    friendly: "Would love to connect whenever you have a moment.",
    concise: "Happy to connect if useful.",
  },
  request: {
    formal: "Thank you in advance for considering this request.",
    friendly: "Thanks so much in advance — I really appreciate it!",
    concise: "Thanks in advance.",
  },
  apology: {
    formal: "I appreciate your understanding and will ensure this does not happen again.",
    friendly: "Thanks for your patience — I'm making sure this won't happen again.",
    concise: "Thanks for understanding.",
  },
};

const greetings: Record<EmailTone, (name: string) => string> = {
  formal: (n) => `Dear ${n || "Sir or Madam"},`,
  friendly: (n) => `Hi ${n || "there"},`,
  concise: (n) => `Hi ${n || "there"},`,
};

const signOffs: Record<EmailTone, string> = {
  formal: "Kind regards,",
  friendly: "Best,",
  concise: "Thanks,",
};

function asSentence(point: string): string {
  const p = point.trim().replace(/^[-*•]\s*/, "");
  if (!p) return "";
  const capitalised = p.charAt(0).toUpperCase() + p.slice(1);
  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
}

export function composeEmail(input: EmailInput): { subject: string; body: string } {
  const topic = input.topic.trim() || "our recent conversation";
  const points = input.points.map(asSentence).filter(Boolean);
  const parts: string[] = [greetings[input.tone](input.recipient.trim()), "", openings[input.type][input.tone](topic)];

  if (points.length) {
    parts.push("");
    if (points.length >= 2) {
      if (input.tone !== "concise") parts.push(input.tone === "formal" ? "In particular:" : "A few quick points:");
      parts.push(...points.map((p) => `• ${p}`));
    } else {
      parts.push(points.join(" "));
    }
  }

  parts.push("", closings[input.type][input.tone], "", signOffs[input.tone], input.sender.trim() || "[Your name]");
  return { subject: subjects[input.type](topic), body: parts.join("\n") };
}
