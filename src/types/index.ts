/**
 * Shared domain types.
 *
 * All site content currently lives in static files under `src/data`. These
 * interfaces describe that content so it can later be replaced by a database
 * or CMS without touching the page components.
 */

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export type ToolCategorySlug =
  | "ai-writing"
  | "ai-image-generation"
  | "ai-video"
  | "ai-coding"
  | "ai-productivity"
  | "ai-marketing"
  | "ai-automation"
  | "ai-business-tools";

/** Keys of the icon registry in `src/components/shared/icon.tsx`. */
export type IconKey =
  | "pen"
  | "image"
  | "video"
  | "code"
  | "gauge"
  | "megaphone"
  | "workflow"
  | "briefcase"
  | "sparkles"
  | "brain"
  | "cpu"
  | "cloud"
  | "layers"
  | "building"
  | "file-text"
  | "mail"
  | "wand"
  | "type"
  | "hash"
  | "case"
  | "braces"
  | "file-code"
  | "search"
  | "headphones"
  | "trending"
  | "users"
  | "bot"
  | "target"
  | "shield"
  | "lightbulb"
  | "compass"
  | "rocket";

export interface ToolCategory {
  slug: ToolCategorySlug;
  name: string;
  description: string;
  icon: IconKey;
  /** Two hex colours used for the category's gradient accent. */
  gradient: [string, string];
}

/* ------------------------------------------------------------------ */
/* AI tools directory                                                  */
/* ------------------------------------------------------------------ */

export type PricingModel = "Free" | "Freemium" | "Paid";

/**
 * Affiliate program details for a tool. Only add this once you have joined
 * the vendor's program and received a real tracking URL — never invent one.
 * A button is shown only when `status` is "active" and `url` is a valid https URL.
 */
export interface AffiliateConfig {
  /** Tracking URL issued by the vendor's affiliate program or network. */
  url: string;
  /** "pending" = applied/awaiting approval, "paused" = temporarily hidden. */
  status: "active" | "pending" | "paused";
  /** Program or network name, for internal reference (e.g. "PartnerStack"). */
  program?: string;
  /** Button text; defaults to "Try {tool name}". */
  ctaLabel?: string;
  /** Extra query parameters appended to the URL, e.g. UTM tags or a sub-ID. */
  trackingParams?: Record<string, string>;
  /** Overrides the standard disclosure shown next to the button. */
  disclosure?: string;
}

export interface AITool {
  slug: string;
  name: string;
  /** Company or organisation that builds the tool. */
  developer: string;
  /** One-line summary, max ~70 characters. */
  tagline: string;
  /** Card description, 1–2 sentences, max ~180 characters. */
  description: string;
  /** Longer overview paragraphs for the detail page. */
  overview: string[];
  category: ToolCategorySlug;
  secondaryCategories?: ToolCategorySlug[];
  pricing: PricingModel;
  /**
   * Plain-language description of the pricing structure. Deliberately avoids
   * exact prices because they change often.
   */
  pricingDetails: string;
  features: string[];
  pros: string[];
  cons: string[];
  useCases: string[];
  /** Slugs of other tools in `tools.ts`. */
  alternatives: string[];
  website: string;
  platforms: string[];
  /** Brand-inspired colours used for the generated monogram logo. */
  brandColors: [string, string];
  featured?: boolean;
  popular?: boolean;
  /** Editorial ordering used by the "Most popular" sort (1 = highest). */
  popularityRank: number;
  /** ISO date the tool was added to the WebAIAutomation directory. */
  addedAt: string;
  /** Optional affiliate program details. See `AffiliateConfig`. */
  affiliate?: AffiliateConfig;
}

/* ------------------------------------------------------------------ */
/* Editorial content (blog articles and how-to guides)                 */
/* ------------------------------------------------------------------ */

/**
 * Inline text supports a tiny subset of Markdown:
 * `**bold**`, `` `code` `` and `[label](/internal-or-https-url)`.
 */
export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; tone?: "info" | "tip" | "warning"; title?: string; text: string }
  | { type: "code"; language: string; code: string };

export interface ContentSection {
  /** URL-safe anchor id, unique within the document. */
  id: string;
  heading: string;
  blocks: ContentBlock[];
}

export type ArticleCategorySlug =
  | "ai-tools"
  | "automation"
  | "productivity"
  | "artificial-intelligence"
  | "machine-learning"
  | "saas"
  | "software-development"
  | "cloud-technology"
  | "business-technology";

export interface ArticleCategory {
  slug: ArticleCategorySlug;
  name: string;
  description: string;
  icon: IconKey;
  /** True for topics featured on the /technology page. */
  isTechnologyTopic: boolean;
}

export interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
}

interface BaseContent {
  slug: string;
  title: string;
  /** Meta description / card excerpt, 120–160 characters. */
  excerpt: string;
  /** Opening paragraph shown before the first section. */
  intro: string;
  sections: ContentSection[];
  authorId: string;
  /** ISO date (YYYY-MM-DD). */
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  /** Slugs from `tools.ts` mentioned in the content. */
  relatedTools?: string[];
  featured?: boolean;
}

export interface Article extends BaseContent {
  category: ArticleCategorySlug;
}

export type GuideCategorySlug =
  | "getting-started"
  | "automation-workflows"
  | "content-creation"
  | "developer-guides"
  | "productivity";

export interface GuideCategory {
  slug: GuideCategorySlug;
  name: string;
  description: string;
}

export interface Guide extends BaseContent {
  category: GuideCategorySlug;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  /** Things the reader needs before starting. */
  prerequisites: string[];
}

/* ------------------------------------------------------------------ */
/* On-site utilities                                                   */
/* ------------------------------------------------------------------ */

export type UtilitySlug =
  | "text-summarizer"
  | "ai-email-writer"
  | "prompt-generator"
  | "word-counter"
  | "character-counter"
  | "case-converter"
  | "json-formatter"
  | "markdown-previewer"
  | "meta-description-generator";

export interface Utility {
  slug: UtilitySlug;
  name: string;
  shortDescription: string;
  description: string;
  icon: IconKey;
  group: "Writing" | "Text" | "Developer" | "SEO";
  /** How the tool works — shown as a badge so users are never misled. */
  mode: "Runs in your browser" | "Template-based" | "Demo mode";
  howToUse: string[];
  examples: { label: string; input: string }[];
  related: UtilitySlug[];
  faqs: { question: string; answer: string }[];
}

/* ------------------------------------------------------------------ */
/* Navigation & site config                                            */
/* ------------------------------------------------------------------ */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  icon?: IconKey;
  children?: NavItem[];
}

export interface FooterGroup {
  title: string;
  links: NavItem[];
}

export type SocialPlatform = "x" | "linkedin" | "youtube" | "github";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}
