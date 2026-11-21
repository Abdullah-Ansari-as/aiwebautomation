import type { Utility, UtilitySlug } from "@/types";

export const utilities: Utility[] = [
  {
    slug: "text-summarizer",
    name: "Text Summarizer",
    shortDescription: "Condense long text into its most important sentences.",
    description:
      "Paste an article, report or email thread and get an extractive summary built from its most informative sentences. Processing happens entirely in your browser — nothing is uploaded.",
    icon: "file-text",
    group: "Writing",
    mode: "Runs in your browser",
    howToUse: [
      "Paste or type at least a few paragraphs of text into the input box.",
      "Choose how many sentences the summary should contain.",
      "Select Summarize. The tool scores each sentence by how many of the text's key terms it contains and keeps the highest-scoring ones in their original order.",
      "Copy the summary and review it — extractive summaries keep original wording, so check that the context still reads correctly.",
    ],
    examples: [
      {
        label: "Product update",
        input:
          "Our team shipped a redesigned onboarding flow this month. The new flow reduces the number of steps from seven to four and adds contextual tips on each screen. Early feedback from support suggests fewer tickets about account setup. We also fixed a long-standing bug that caused duplicate notifications for some users. Next month, the focus shifts to performance improvements on mobile devices, especially for older Android phones. The design team is running interviews to understand how teams share dashboards, which will shape the collaboration roadmap for the next quarter.",
      },
      {
        label: "Automation memo",
        input:
          "Manual data entry is the biggest time sink for the operations team. Every new order is copied from the store into the spreadsheet, then into the invoicing system. Automating this handoff would remove three copy-and-paste steps per order. A workflow tool can watch for new orders and create invoice drafts automatically. A person should still review invoices above a certain value before they are sent. We propose a two-week pilot with a small set of orders, measuring time saved and errors caught.",
      },
    ],
    related: ["word-counter", "meta-description-generator", "ai-email-writer"],
    faqs: [
      {
        question: "Is this an AI summarizer?",
        answer:
          "Not yet. It uses a transparent extractive algorithm (sentence scoring by term frequency) that runs locally. An AI-powered abstractive mode is planned once a secure server-side API is connected.",
      },
      {
        question: "Is my text sent anywhere?",
        answer: "No. All processing happens in your browser tab and the text is never uploaded.",
      },
    ],
  },
  {
    slug: "ai-email-writer",
    name: "AI Email Writer",
    shortDescription: "Compose professional emails from a few details and a tone.",
    description:
      "Fill in the recipient, purpose and key points, choose a tone, and get a well-structured email draft. The current version uses professionally written templates; AI generation will be enabled once an API is connected.",
    icon: "mail",
    group: "Writing",
    mode: "Template-based",
    howToUse: [
      "Choose the type of email you need, such as a follow-up or a meeting request.",
      "Enter the recipient's name, your name and the key points you want to include.",
      "Pick a tone — formal, friendly or concise.",
      "Generate the draft, then edit the details before sending. Always review emails before they go out.",
    ],
    examples: [
      { label: "Follow-up after a demo", input: "Thanks for the demo call\nShare the pricing overview\nPropose a call next week" },
      { label: "Meeting request", input: "Discuss Q3 automation roadmap\n30 minutes\nAny time Tuesday or Wednesday" },
    ],
    related: ["prompt-generator", "text-summarizer", "word-counter"],
    faqs: [
      {
        question: "Does this use AI right now?",
        answer:
          "No. The tool is clearly in template mode: it assembles your details into tested email structures. When an AI API is connected, an AI option will appear and be labelled as such.",
      },
      {
        question: "Is my information stored?",
        answer: "No. Everything stays in your browser and disappears when you close the page.",
      },
    ],
  },
  {
    slug: "prompt-generator",
    name: "Prompt Generator",
    shortDescription: "Build structured, high-quality prompts for any AI assistant.",
    description:
      "Turn a rough idea into a clear prompt with role, context, task, format and constraints. Use the result in ChatGPT, Claude, Gemini or any other assistant.",
    icon: "wand",
    group: "Writing",
    mode: "Template-based",
    howToUse: [
      "Describe the task you want the AI to perform.",
      "Optionally add a role, audience, context, output format and constraints.",
      "Select Generate prompt to assemble a structured prompt.",
      "Copy the prompt into your AI assistant and iterate on the result.",
    ],
    examples: [
      { label: "Blog outline", input: "Create an outline for a blog post about automating invoice processing" },
      { label: "Code review", input: "Review a Python function for readability and edge cases" },
      { label: "Customer reply", input: "Write a reply to a customer asking for a refund after the trial ended" },
    ],
    related: ["ai-email-writer", "text-summarizer", "markdown-previewer"],
    faqs: [
      {
        question: "Why structure prompts?",
        answer:
          "Clear roles, context and output requirements reduce ambiguity, which usually makes AI responses more relevant and easier to use.",
      },
    ],
  },
  {
    slug: "word-counter",
    name: "Word Counter",
    shortDescription: "Count words, sentences, paragraphs and reading time.",
    description:
      "Get live counts of words, characters, sentences and paragraphs, plus estimated reading and speaking time and the most frequent keywords.",
    icon: "type",
    group: "Text",
    mode: "Runs in your browser",
    howToUse: [
      "Type or paste text into the editor.",
      "Statistics update instantly as you type.",
      "Review keyword density to spot over-used words.",
    ],
    examples: [
      {
        label: "Short paragraph",
        input:
          "Automation works best when it removes repetitive steps without hiding important decisions. Start small, measure the result and expand once the workflow is reliable.",
      },
    ],
    related: ["character-counter", "case-converter", "text-summarizer"],
    faqs: [
      {
        question: "How is reading time calculated?",
        answer: "Reading time assumes 225 words per minute; speaking time assumes 140 words per minute.",
      },
    ],
  },
  {
    slug: "character-counter",
    name: "Character Counter",
    shortDescription: "Check character limits for titles, posts and meta tags.",
    description:
      "Count characters with and without spaces and compare your text against common limits for SEO titles, meta descriptions and social posts.",
    icon: "hash",
    group: "Text",
    mode: "Runs in your browser",
    howToUse: [
      "Paste or type your text.",
      "See total characters, characters without spaces, and bytes.",
      "Check the limit indicators to see whether your text fits common platform limits.",
    ],
    examples: [
      { label: "SEO title", input: "Best AI Writing Tools Compared: Which One Fits Your Workflow?" },
      {
        label: "Meta description",
        input:
          "Compare popular AI writing assistants by use case, pricing model and strengths, and learn how to pick the right tool for drafting, editing and marketing copy.",
      },
    ],
    related: ["word-counter", "meta-description-generator", "case-converter"],
    faqs: [
      {
        question: "Are the platform limits official?",
        answer:
          "They are common guidelines (for example, search engines typically truncate titles around 60 characters). Platforms change limits, so treat them as guidance.",
      },
    ],
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    shortDescription: "Convert text between upper, lower, title, camel and more.",
    description:
      "Instantly transform text into UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case or kebab-case.",
    icon: "case",
    group: "Text",
    mode: "Runs in your browser",
    howToUse: [
      "Paste your text into the input box.",
      "Choose the case you want to convert to.",
      "Copy the converted output.",
    ],
    examples: [
      { label: "Heading", input: "how to automate email follow-ups with ai" },
      { label: "Variable name", input: "Customer Lifetime Value" },
    ],
    related: ["word-counter", "character-counter", "json-formatter"],
    faqs: [
      {
        question: "How does Title Case handle short words?",
        answer:
          "Short articles, conjunctions and prepositions (like a, and, of, to) stay lowercase unless they are the first or last word.",
      },
    ],
  },
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    shortDescription: "Format, validate and minify JSON with clear error messages.",
    description:
      "Paste JSON to pretty-print it with your preferred indentation, minify it for transport, or validate it and see exactly where a syntax error occurs.",
    icon: "braces",
    group: "Developer",
    mode: "Runs in your browser",
    howToUse: [
      "Paste JSON into the input editor.",
      "Choose Format to pretty-print, or Minify to remove whitespace.",
      "If the JSON is invalid, the error message shows what went wrong and where.",
      "Copy the result for use in your code or API client.",
    ],
    examples: [
      {
        label: "Webhook payload",
        input:
          '{"event":"order.created","data":{"id":1042,"customer":{"name":"Ada","email":"ada@example.com"},"items":[{"sku":"PLAN-PRO","qty":1}],"total":49.0}}',
      },
      { label: "Invalid JSON", input: '{"name": "Workflow", "steps": [1, 2, 3,], }' },
    ],
    related: ["markdown-previewer", "case-converter", "character-counter"],
    faqs: [
      {
        question: "Is my JSON uploaded?",
        answer: "No. Parsing and formatting use your browser's built-in JSON engine.",
      },
    ],
  },
  {
    slug: "markdown-previewer",
    name: "Markdown Previewer",
    shortDescription: "Write Markdown and see a live, formatted preview.",
    description:
      "Write or paste Markdown and see a live preview with headings, lists, links, quotes and code blocks. Ideal for README files, docs and AI-generated content.",
    icon: "file-code",
    group: "Developer",
    mode: "Runs in your browser",
    howToUse: [
      "Write Markdown in the editor on the left.",
      "The preview updates as you type.",
      "Copy the Markdown or the rendered HTML.",
    ],
    examples: [
      {
        label: "README",
        input:
          "# Invoice Automation\n\nA workflow that turns **new orders** into invoice drafts.\n\n## Steps\n\n1. Watch for new orders\n2. Create an invoice draft\n3. Notify the finance channel\n\n> Invoices above the review threshold are checked by a person.\n\n```js\nconst total = items.reduce((sum, i) => sum + i.price, 0);\n```\n\nLearn more in our [automation guide](/automation).",
      },
    ],
    related: ["json-formatter", "word-counter", "prompt-generator"],
    faqs: [
      {
        question: "Is raw HTML supported?",
        answer:
          "No. For safety, HTML in the input is escaped and shown as text. Links are limited to http, https, mailto and relative URLs.",
      },
    ],
  },
  {
    slug: "meta-description-generator",
    name: "Meta Description Generator",
    shortDescription: "Create search-friendly meta descriptions within ideal length.",
    description:
      "Enter a page title, primary keyword and summary to generate several meta description options, each checked against the recommended 120–160 character range.",
    icon: "search",
    group: "SEO",
    mode: "Template-based",
    howToUse: [
      "Enter your page topic or title and the primary keyword.",
      "Add a one-sentence summary of what the page offers and an optional call to action.",
      "Generate options and pick the one that best matches the page.",
      "Edit as needed — each option shows its character count and length status.",
    ],
    examples: [
      { label: "Tool review", input: "AI writing tools|AI writing tools|compare features, pricing models and best use cases" },
      { label: "How-to guide", input: "Self-host n8n with Docker|self-host n8n|set up n8n on your own server step by step" },
    ],
    related: ["character-counter", "word-counter", "text-summarizer"],
    faqs: [
      {
        question: "What length should a meta description be?",
        answer:
          "Search engines usually display roughly 120–160 characters. Longer descriptions may be truncated, and search engines can rewrite them.",
      },
    ],
  },
];

export function getUtility(slug: string): Utility | undefined {
  return utilities.find((u) => u.slug === slug);
}

export function getRelatedUtilities(slugs: UtilitySlug[]): Utility[] {
  return slugs.map((s) => getUtility(s)).filter((u): u is Utility => Boolean(u));
}
