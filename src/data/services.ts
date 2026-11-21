import type { ServiceValue } from "@/lib/inquiry-options";
import type { IconKey } from "@/types";

/**
 * Automation services offered by WebAIAutomation. This describes the offer
 * only — no client names, results or statistics are claimed. Review package
 * scope and wording before launch so it matches what you will actually deliver.
 */

export interface Service {
  /** Matches a value in SERVICE_OPTIONS so CTAs can preselect it in the form. */
  id: Exclude<ServiceValue, "not-sure">;
  title: string;
  icon: IconKey;
  summary: string;
  problem: string;
  solution: string;
  deliverables: string[];
  benefits: string[];
  /** Tool slugs from tools.ts commonly used for this service. */
  tools: string[];
}

export const services: Service[] = [
  {
    id: "ai-automation",
    title: "AI Automation Services",
    icon: "sparkles",
    summary: "Add AI steps to everyday workflows — classify, summarise, extract and draft — with a person reviewing what matters.",
    problem:
      "Your team spends hours reading, sorting and rewriting the same kinds of messages, documents and requests, and the work piles up whenever someone is busy or away.",
    solution:
      "We map the repetitive, language-heavy steps in your process and automate them with AI models connected to the tools you already use, adding human approval wherever an error would be costly.",
    deliverables: [
      "Process review and automation plan",
      "Working AI-assisted workflow in your accounts",
      "Prompts and rules documented for your team",
      "Error alerts and a human review step where needed",
    ],
    benefits: ["Less time on repetitive reading and writing", "Faster, more consistent responses", "A process that keeps running when people are busy"],
    tools: ["chatgpt", "claude", "zapier", "make"],
  },
  {
    id: "n8n-workflows",
    title: "n8n Workflow Development",
    icon: "workflow",
    summary: "Custom n8n workflows — cloud or self-hosted — for teams that want flexibility and control over their data.",
    problem:
      "Off-the-shelf automation platforms get expensive as task volume grows, or can't handle the custom logic, APIs and data-handling rules your business needs.",
    solution:
      "We design and build n8n workflows on n8n Cloud or your own server, using webhooks, API calls, code steps and AI nodes where they help, and set up credentials securely.",
    deliverables: [
      "n8n workflows built and tested with your data",
      "Webhook, API and AI node configuration",
      "Self-hosting setup guidance or configuration (if required)",
      "Workflow documentation and a handover walkthrough",
    ],
    benefits: ["Predictable running costs at higher volumes", "Full control over logic and data", "No vendor lock-in for your workflows"],
    tools: ["n8n"],
  },
  {
    id: "make-zapier",
    title: "Make.com & Zapier Integrations",
    icon: "layers",
    summary: "Connect your apps so data moves automatically — no more copying between forms, spreadsheets, CRMs and inboxes.",
    problem:
      "Information lives in too many apps. Someone has to copy form entries into spreadsheets, update the CRM by hand and remember to notify the right people.",
    solution:
      "We build reliable Zaps and Make scenarios that move data between your apps the moment something changes, with filters, formatting and error handling so nothing silently fails.",
    deliverables: [
      "Zaps or Make scenarios built in your account",
      "Field mapping, filters and data formatting",
      "Error handling and failure notifications",
      "Handover notes explaining how each automation works",
    ],
    benefits: ["No more manual copy-and-paste", "Fewer data-entry mistakes", "Teams notified the moment something happens"],
    tools: ["zapier", "make"],
  },
  {
    id: "crm-automation",
    title: "CRM Automation",
    icon: "users",
    summary: "Keep your CRM accurate and your pipeline moving without asking your team to do data entry.",
    problem:
      "Leads go cold because follow-ups are forgotten, deal stages are out of date, and the CRM is only as good as the time people have to update it.",
    solution:
      "We automate lead creation, assignment, follow-up tasks, deal-stage updates and reminders in your CRM, and connect it to your forms, inbox and calendar.",
    deliverables: [
      "Automatic lead capture into your CRM",
      "Lead assignment and follow-up task rules",
      "Deal-stage and reminder automations",
      "Documentation of every rule and trigger",
    ],
    benefits: ["Faster response to new leads", "A CRM your team can trust", "Fewer deals lost to missed follow-ups"],
    tools: ["zapier", "make", "chatgpt"],
  },
  {
    id: "ai-chatbot",
    title: "AI Chatbot Development",
    icon: "bot",
    summary: "AI assistants for your website or team that answer from your own content and hand over to a person when needed.",
    problem:
      "The same customer questions arrive every day, visitors leave when nobody answers quickly, and staff search through documents to find answers.",
    solution:
      "We build AI chatbots grounded in your FAQs, documents and policies, with clear limits on what they answer, lead capture, and a hand-off to a human for anything sensitive.",
    deliverables: [
      "Chatbot trained on your approved content",
      "Website or internal-tool integration",
      "Escalation to a human and lead capture",
      "Testing against real questions before launch",
    ],
    benefits: ["Instant answers outside office hours", "Fewer repetitive questions for your team", "More enquiries captured from your website"],
    tools: ["chatgpt", "claude"],
  },
  {
    id: "lead-generation",
    title: "Lead Generation Automation",
    icon: "target",
    summary: "Capture, enrich, qualify and route every lead automatically so sales follows up while interest is high.",
    problem:
      "Leads arrive from forms, ads, email and social, but they're handled inconsistently — some are qualified late, routed to the wrong person or never followed up.",
    solution:
      "We automate the path from first contact to first reply: capture from every source, enrichment and AI-assisted qualification, routing to the right owner and instant notifications.",
    deliverables: [
      "Lead capture from your forms and channels",
      "Enrichment and qualification rules",
      "Routing to the right person or pipeline",
      "Instant alerts and an automatic first response",
    ],
    benefits: ["Every lead handled the same way", "Faster first response", "Sales time spent on qualified leads"],
    tools: ["make", "zapier", "chatgpt"],
  },
  {
    id: "email-automation",
    title: "Email Automation",
    icon: "mail",
    summary: "Follow-ups, onboarding sequences and inbox triage that run on time, every time.",
    problem:
      "Follow-up emails depend on someone remembering to send them, onboarding messages are inconsistent, and important emails get buried in busy inboxes.",
    solution:
      "We set up triggered email sequences, AI-drafted replies for human approval, and inbox rules that label, route and summarise incoming messages.",
    deliverables: [
      "Triggered follow-up and onboarding sequences",
      "AI-drafted replies queued for approval",
      "Inbox triage, labelling and routing",
      "Templates and sending rules documented",
    ],
    benefits: ["Follow-ups that never get forgotten", "Consistent customer communication", "Less time managing the inbox"],
    tools: ["zapier", "make", "chatgpt"],
  },
  {
    id: "custom-ai",
    title: "Custom AI Business Solutions",
    icon: "lightbulb",
    summary: "Tailored AI tools and integrations for problems that off-the-shelf software doesn't solve.",
    problem:
      "You have a specific bottleneck — documents to process, reports to compile, data to clean — and no existing tool fits the way your business works.",
    solution:
      "We scope the problem with you, choose the simplest reliable approach — from AI document extraction to internal tools built on AI model APIs — and deliver it in stages you can test.",
    deliverables: [
      "Discovery session and written solution proposal",
      "Prototype to validate the approach",
      "Production build integrated with your systems",
      "Documentation and team walkthrough",
    ],
    benefits: ["A solution shaped around your process", "Validated before you commit to the full build", "Clear ownership of what's delivered"],
    tools: ["claude", "chatgpt", "n8n"],
  },
];

export interface PricingPackage {
  id: "starter" | "growth" | "business";
  name: string;
  /** Indicative starting price in USD. */
  fromPrice: number;
  /** Budget value preselected in the quote form. */
  budget: "75-199" | "199-399" | "399-1000";
  bestFor: string;
  includes: string[];
  highlighted?: boolean;
}

export const pricingPackages: PricingPackage[] = [
  {
    id: "starter",
    name: "Starter",
    fromPrice: 75,
    budget: "75-199",
    bestFor: "One repetitive task you want off your plate",
    includes: [
      "One automation connecting a few apps",
      "Built and tested in your account",
      "Short handover notes",
      "Bug fixes after launch",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    fromPrice: 199,
    budget: "199-399",
    bestFor: "Multi-step workflows with AI steps",
    includes: [
      "Multi-step workflow or a small set of related automations",
      "AI steps such as classification, extraction or drafting",
      "Error handling and failure alerts",
      "Documentation and a walkthrough",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    fromPrice: 399,
    budget: "399-1000",
    bestFor: "CRM, chatbot or multi-system projects",
    includes: [
      "Connected workflows across several systems",
      "Custom logic, webhooks or API integrations",
      "Human review steps and monitoring",
      "Documentation and a team training session",
    ],
  },
];

export const processSteps = [
  { title: "Tell us what you need", text: "Send the quote form or message us. Describe the task, the tools you use and what a good result looks like." },
  { title: "Consultation & scoping", text: "We review your process, ask follow-up questions and confirm what's feasible — and whether automation is worth it." },
  { title: "Fixed written quote", text: "You receive the scope, price and timeline in writing before any work starts. No surprise invoices." },
  { title: "Build & test", text: "We build in your accounts and test with realistic data, keeping you updated as we go." },
  { title: "Handover & support", text: "You get documentation and a walkthrough, and we fix any bugs found after launch." },
];

export const useCases: { title: string; icon: IconKey; examples: string[] }[] = [
  {
    title: "E-commerce stores",
    icon: "briefcase",
    examples: ["Order and stock alerts to your team chat", "Post-purchase and review-request emails", "Customer questions answered by an AI assistant"],
  },
  {
    title: "Agencies & freelancers",
    icon: "users",
    examples: ["Client onboarding forms to project boards", "Automated weekly reporting", "Lead enquiries routed and answered quickly"],
  },
  {
    title: "Real estate",
    icon: "building",
    examples: ["Portal enquiries into your CRM instantly", "Viewing reminders and follow-ups", "Listing descriptions drafted for review"],
  },
  {
    title: "Clinics & local services",
    icon: "headphones",
    examples: ["Booking confirmations and reminders", "After-hours enquiry handling", "Review requests after appointments"],
  },
  {
    title: "SaaS & startups",
    icon: "rocket",
    examples: ["Trial sign-up enrichment and routing", "Support ticket triage and summaries", "Product feedback collected in one place"],
  },
  {
    title: "Coaches & consultants",
    icon: "compass",
    examples: ["Discovery-call booking and prep", "Session notes summarised into action items", "Invoice and payment reminders"],
  },
];

export const serviceFaqs: { question: string; answer: string }[] = [
  {
    question: "Why are the prices shown as “from”?",
    answer:
      "The packages are indicative starting points. The final price depends on the number of apps and steps, the complexity of the logic, data volume and how much testing is needed. You always get a fixed written quote before any work starts.",
  },
  {
    question: "Are software subscriptions included in the price?",
    answer:
      "No. Automations run in your own accounts, so subscription and usage costs for tools such as Zapier, Make, n8n Cloud, your CRM or AI model APIs are paid directly by you. We'll tell you up front which plans the project needs.",
  },
  {
    question: "Which tools do you work with?",
    answer:
      "Most projects use Zapier, Make.com or n8n together with common business apps — Google Workspace, Microsoft 365, Slack, popular CRMs, form builders and e-commerce platforms — plus AI models from providers such as OpenAI and Anthropic. If you use something else, mention it in your request.",
  },
  {
    question: "Who owns the automations once they're built?",
    answer: "You do. Everything is built in accounts you control, and you receive documentation so your team can understand, change or hand over the workflows.",
  },
  {
    question: "How long does a project take?",
    answer:
      "It depends on scope. A single straightforward automation is usually the quickest; projects that connect several systems or include a chatbot take longer. Your quote includes a timeline before you commit.",
  },
  {
    question: "How do you handle access to my accounts and data?",
    answer:
      "We ask only for the access a project needs and prefer to be invited as a user rather than receive shared passwords. You can remove our access at handover, and we keep your data out of tools and accounts that aren't part of the agreed solution.",
  },
  {
    question: "What happens if an automation breaks later?",
    answer:
      "We build in error notifications so problems are noticed quickly, and fix bugs found after launch as described in your quote. Ongoing maintenance or changes can be arranged separately if you need them.",
  },
  {
    question: "I'm not sure what to automate. Can you help?",
    answer: "Yes. Choose “Not sure yet” in the form and describe your daily tasks and tools. We'll suggest where automation could help — and tell you honestly if it isn't worth it.",
  },
];

/** Which service an automation guide or article should promote. */
export const contentServiceMap: Record<string, Service["id"]> = {
  "how-to-automate-email-follow-ups-with-zapier": "email-automation",
  "how-to-build-a-lead-routing-workflow-with-make": "lead-generation",
  "how-to-self-host-n8n-with-docker": "n8n-workflows",
  "how-to-summarize-meetings-with-ai": "ai-automation",
  "what-is-ai-workflow-automation": "ai-automation",
  "zapier-vs-make-vs-n8n": "make-zapier",
};

export function getService(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

export function serviceQuoteHref(serviceId?: string, budget?: string): string {
  const params = new URLSearchParams();
  if (serviceId) params.set("service", serviceId);
  if (budget) params.set("budget", budget);
  const query = params.toString();
  return `/services${query ? `?${query}` : ""}#quote`;
}
