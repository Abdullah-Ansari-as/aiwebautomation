import type {
  ArticleCategory,
  ArticleCategorySlug,
  GuideCategory,
  GuideCategorySlug,
  ToolCategory,
  ToolCategorySlug,
} from "@/types";

export const toolCategories: ToolCategory[] = [
  {
    slug: "ai-writing",
    name: "AI Writing",
    description: "Assistants that draft, edit, rephrase and polish written content.",
    icon: "pen",
    gradient: ["#8b5cf6", "#6366f1"],
  },
  {
    slug: "ai-image-generation",
    name: "AI Image Generation",
    description: "Create illustrations, product shots and concept art from text prompts.",
    icon: "image",
    gradient: ["#ec4899", "#8b5cf6"],
  },
  {
    slug: "ai-video",
    name: "AI Video",
    description: "Generate, edit and voice video content with AI-assisted workflows.",
    icon: "video",
    gradient: ["#f43f5e", "#f97316"],
  },
  {
    slug: "ai-coding",
    name: "AI Coding",
    description: "Code completion, chat-based programming help and local model runners.",
    icon: "code",
    gradient: ["#06b6d4", "#3b82f6"],
  },
  {
    slug: "ai-productivity",
    name: "AI Productivity",
    description: "General-purpose assistants for research, notes, meetings and everyday work.",
    icon: "gauge",
    gradient: ["#3b82f6", "#6366f1"],
  },
  {
    slug: "ai-marketing",
    name: "AI Marketing",
    description: "Campaign copy, brand voice and go-to-market content at scale.",
    icon: "megaphone",
    gradient: ["#f59e0b", "#ef4444"],
  },
  {
    slug: "ai-automation",
    name: "AI Automation",
    description: "Connect apps and build workflows that run with or without AI steps.",
    icon: "workflow",
    gradient: ["#10b981", "#06b6d4"],
  },
  {
    slug: "ai-business-tools",
    name: "AI Business Tools",
    description: "Presentations, knowledge bases and meeting intelligence for teams.",
    icon: "briefcase",
    gradient: ["#6366f1", "#0ea5e9"],
  },
];

export const articleCategories: ArticleCategory[] = [
  {
    slug: "ai-tools",
    name: "AI Tools",
    description: "Comparisons, reviews and roundups of AI products.",
    icon: "sparkles",
    isTechnologyTopic: false,
  },
  {
    slug: "automation",
    name: "Automation",
    description: "Workflow automation concepts, platforms and patterns.",
    icon: "workflow",
    isTechnologyTopic: false,
  },
  {
    slug: "productivity",
    name: "Productivity",
    description: "Practical habits for working better with AI.",
    icon: "gauge",
    isTechnologyTopic: false,
  },
  {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
    description: "How modern AI systems work and how to use them responsibly.",
    icon: "brain",
    isTechnologyTopic: true,
  },
  {
    slug: "machine-learning",
    name: "Machine Learning",
    description: "Core ML concepts explained for builders and decision-makers.",
    icon: "cpu",
    isTechnologyTopic: true,
  },
  {
    slug: "saas",
    name: "SaaS",
    description: "How software-as-a-service products are evolving with AI.",
    icon: "layers",
    isTechnologyTopic: true,
  },
  {
    slug: "software-development",
    name: "Software Development",
    description: "AI-assisted engineering, tooling and best practices.",
    icon: "code",
    isTechnologyTopic: true,
  },
  {
    slug: "cloud-technology",
    name: "Cloud Technology",
    description: "Cloud platforms, infrastructure and managed AI services.",
    icon: "cloud",
    isTechnologyTopic: true,
  },
  {
    slug: "business-technology",
    name: "Business Technology",
    description: "Adopting technology strategically in growing organisations.",
    icon: "building",
    isTechnologyTopic: true,
  },
];

export const guideCategories: GuideCategory[] = [
  {
    slug: "getting-started",
    name: "Getting Started",
    description: "Foundations for using AI tools effectively.",
  },
  {
    slug: "automation-workflows",
    name: "Automation Workflows",
    description: "Step-by-step builds on popular automation platforms.",
  },
  {
    slug: "content-creation",
    name: "Content Creation",
    description: "Create images, video and written content with AI.",
  },
  {
    slug: "developer-guides",
    name: "Developer Guides",
    description: "Hands-on guides for engineers and technical teams.",
  },
  {
    slug: "productivity",
    name: "Productivity",
    description: "Save time on meetings, notes and everyday tasks.",
  },
];

export function getToolCategory(slug: ToolCategorySlug | string): ToolCategory | undefined {
  return toolCategories.find((c) => c.slug === slug);
}

export function getArticleCategory(slug: ArticleCategorySlug | string): ArticleCategory | undefined {
  return articleCategories.find((c) => c.slug === slug);
}

export function getGuideCategory(slug: GuideCategorySlug | string): GuideCategory | undefined {
  return guideCategories.find((c) => c.slug === slug);
}
