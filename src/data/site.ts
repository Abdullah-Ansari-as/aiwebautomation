import type { Author, SocialLink } from "@/types";

/**
 * Global site configuration. `url` is the canonical production origin and is
 * used for canonical URLs, Open Graph, sitemap and structured data — never
 * localhost.
 */
export const siteConfig = {
  name: "WebAIAutomation",
  domain: "WebAIAutomation.com",
  url: "https://webaiautomation.com",
  tagline: "AI tools, automation and technology insights",
  description:
    "Discover the best AI tools, learn practical automation workflows and stay ahead with clear, independent guides on AI and technology.",
  /** Placeholder inbox — replace with the real address before launch. */
  email: "hello@webaiautomation.com",
  locale: "en_US",
  twitterHandle: "@webaiautomation",
  /** Year the publication started, used in the footer copyright range. */
  foundedYear: 2026,
  /**
   * WhatsApp business number in international format, digits only (e.g.
   * 15551234567). Set NEXT_PUBLIC_WHATSAPP_NUMBER at build time; WhatsApp
   * buttons stay hidden until it is configured.
   */
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
} as const;

/**
 * Social profile URLs. These are placeholders until the real profiles are
 * confirmed — update the hrefs here and every footer/contact link follows.
 */
export const socialLinks: SocialLink[] = [
  { platform: "x", label: "WebAIAutomation on X", href: "https://x.com/webaiautomation" },
  {
    platform: "linkedin",
    label: "WebAIAutomation on LinkedIn",
    href: "https://www.linkedin.com/company/webaiautomation",
  },
  {
    platform: "youtube",
    label: "WebAIAutomation on YouTube",
    href: "https://www.youtube.com/@webaiautomation",
  },
  { platform: "github", label: "WebAIAutomation on GitHub", href: "https://github.com/webaiautomation" },
];

export const authors: Author[] = [
  {
    id: "editorial-team",
    name: "WebAIAutomation Editorial Team",
    role: "Editors",
    bio: "Our editors test AI tools hands-on, document real workflows and keep every guide focused on practical, verifiable advice.",
  },
  {
    id: "research-desk",
    name: "WebAIAutomation Research Desk",
    role: "Research & Analysis",
    bio: "The research desk tracks the AI and automation landscape, compares products side by side and explains the technology behind them.",
  },
];

export function getAuthor(id: string): Author {
  return authors.find((a) => a.id === id) ?? authors[0];
}
