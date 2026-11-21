import type { IconKey } from "@/types";

export interface AutomationArea {
  id: string;
  title: string;
  icon: IconKey;
  summary: string;
  examples: string[];
  /** Tool slugs from tools.ts. */
  tools: string[];
}

export interface WorkflowExample {
  id: string;
  title: string;
  area: string;
  trigger: string;
  steps: string[];
  outcome: string;
  tools: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export const automationIntro = {
  title: "What is workflow automation?",
  paragraphs: [
    "Workflow automation connects the apps you already use so that routine work happens without manual copying, pasting and checking. A workflow starts with a trigger — a new form submission, a paid invoice, an incoming email — and runs a sequence of actions such as creating records, sending messages or updating spreadsheets.",
    "AI adds a new kind of step. Instead of only moving data, a workflow can now classify a support ticket, summarise a call transcript, draft a reply or extract fields from a document. The most reliable automations combine both: deterministic steps for moving data, AI steps for language-heavy tasks, and a human review point wherever a mistake would be costly.",
  ],
  principles: [
    { title: "Start with a repetitive, well-defined task", text: "Choose work that happens often, follows the same steps and has a clear definition of done." },
    { title: "Keep a human in the loop", text: "Route AI-drafted output to a person for approval when it reaches customers or affects money." },
    { title: "Measure before and after", text: "Record how long the task takes today so you can judge whether the automation actually helps." },
    { title: "Plan for failure", text: "Add error notifications and retries so a broken step is noticed instead of silently dropping data." },
  ],
};

export const automationAreas: AutomationArea[] = [
  {
    id: "business-automation",
    title: "Business Automation",
    icon: "briefcase",
    summary:
      "Remove manual hand-offs between finance, operations and admin tools so information moves the moment it changes.",
    examples: [
      "Create invoice drafts when an order is marked complete",
      "Sync new employees from a form into HR and IT checklists",
      "Archive signed documents into the right shared folder",
      "Send a weekly operations digest compiled from several tools",
    ],
    tools: ["zapier", "make", "n8n", "notion-ai"],
  },
  {
    id: "marketing-automation",
    title: "Marketing Automation",
    icon: "megaphone",
    summary:
      "Coordinate content, campaigns and audience data so your team spends more time on strategy and less on busywork.",
    examples: [
      "Turn a published blog post into draft social posts for review",
      "Add new newsletter subscribers to your CRM with source tags",
      "Generate first-draft ad variations for a human editor",
      "Create on-brand images for campaigns from a template",
    ],
    tools: ["jasper", "copy-ai", "canva-magic-studio", "zapier"],
  },
  {
    id: "sales-automation",
    title: "Sales Automation",
    icon: "trending",
    summary:
      "Capture, qualify and route leads quickly, and keep the CRM accurate without asking reps to do data entry.",
    examples: [
      "Route inbound leads to the right owner based on region or company size",
      "Summarise discovery calls and log notes to the CRM",
      "Draft personalised follow-up emails for rep approval",
      "Alert the team in chat when a high-value deal changes stage",
    ],
    tools: ["make", "fireflies-ai", "chatgpt", "zapier"],
  },
  {
    id: "customer-support-automation",
    title: "Customer Support Automation",
    icon: "headphones",
    summary:
      "Triage incoming requests, suggest answers from your knowledge base and escalate the right issues to the right people.",
    examples: [
      "Classify new tickets by topic and urgency",
      "Suggest draft replies grounded in help-centre articles",
      "Escalate negative-sentiment conversations to a team lead",
      "Summarise long ticket threads before hand-off",
    ],
    tools: ["claude", "chatgpt", "n8n", "zapier"],
  },
  {
    id: "no-code-automation",
    title: "No-Code Automation",
    icon: "workflow",
    summary:
      "Visual builders let non-developers design reliable workflows with triggers, filters, branches and AI steps — no code required.",
    examples: [
      "Build multi-step workflows with a drag-and-drop editor",
      "Use filters and routers to handle different cases",
      "Add AI steps for summarising, classifying or drafting text",
      "Self-host workflows when data must stay on your own servers",
    ],
    tools: ["zapier", "make", "n8n"],
  },
];

export const workflowExamples: WorkflowExample[] = [
  {
    id: "lead-capture-to-crm",
    title: "Lead capture to CRM with AI enrichment",
    area: "Sales",
    trigger: "New website form submission",
    steps: [
      "Normalise name, email and company fields",
      "AI step classifies the enquiry type and urgency",
      "Create or update the contact in your CRM",
      "Notify the assigned owner in your team chat",
    ],
    outcome: "Every lead is logged and routed within minutes, with context attached.",
    tools: ["zapier", "chatgpt"],
    difficulty: "Beginner",
  },
  {
    id: "meeting-notes-to-tasks",
    title: "Meeting notes to action items",
    area: "Productivity",
    trigger: "Meeting transcript is ready",
    steps: [
      "AI step summarises decisions and action items",
      "Owner reviews and edits the summary",
      "Create tasks in your project management tool",
      "Post the summary to the project channel",
    ],
    outcome: "Decisions and owners are captured consistently after every call.",
    tools: ["fireflies-ai", "make", "notion-ai"],
    difficulty: "Beginner",
  },
  {
    id: "support-ticket-triage",
    title: "Support ticket triage",
    area: "Customer support",
    trigger: "New support ticket created",
    steps: [
      "AI step labels topic, product area and sentiment",
      "Router sends billing, bugs and how-to questions to different queues",
      "Draft a suggested reply for the agent to review",
      "Escalate urgent or negative tickets to a lead",
    ],
    outcome: "Agents start with context and a draft instead of an empty reply box.",
    tools: ["n8n", "claude"],
    difficulty: "Intermediate",
  },
  {
    id: "content-repurposing",
    title: "Blog post to social drafts",
    area: "Marketing",
    trigger: "New article published (RSS or CMS webhook)",
    steps: [
      "Fetch the article text",
      "AI step drafts platform-specific post variations",
      "Save drafts to a review board",
      "Schedule approved posts in your social tool",
    ],
    outcome: "Each article gets a consistent distribution plan with human approval.",
    tools: ["make", "jasper"],
    difficulty: "Intermediate",
  },
  {
    id: "invoice-processing",
    title: "Invoice intake and filing",
    area: "Finance",
    trigger: "Invoice email arrives in a shared inbox",
    steps: [
      "Extract vendor, amount and due date from the attachment",
      "Check totals against a purchase order sheet",
      "Flag mismatches for manual review",
      "File the PDF and log the record in your accounting sheet",
    ],
    outcome: "Fewer missed due dates and a searchable record of every invoice.",
    tools: ["zapier", "n8n"],
    difficulty: "Advanced",
  },
];

export const automationFaqs = [
  {
    question: "Do I need to know how to code to automate workflows?",
    answer:
      "No. Visual platforms such as Zapier, Make and n8n let you build workflows by connecting steps in an editor. Coding knowledge helps for advanced logic and custom API calls, but many useful workflows need none.",
  },
  {
    question: "Is it safe to send company data to AI steps?",
    answer:
      "It depends on the provider's data policies and your own obligations. Review each vendor's terms, avoid sending sensitive personal data unless you have a clear basis to do so, and consider self-hosted options when data must stay in your environment.",
  },
  {
    question: "Which automation platform should I start with?",
    answer:
      "Start with the platform that already integrates with your core apps and matches your team's skills. Zapier is known for ease of use, Make for visual multi-branch scenarios, and n8n for flexibility and self-hosting. Read our comparison before deciding.",
  },
  {
    question: "How do I keep AI-generated output accurate?",
    answer:
      "Give AI steps clear instructions and examples, constrain the output format, and add a review step before anything reaches customers. Monitor results regularly and adjust prompts when you spot errors.",
  },
];
