import { siteConfig, socialLinks } from "@/data/site";
import { absoluteUrl } from "@/lib/seo";
import type { AITool, Article, Author, Guide, Utility } from "@/types";

/**
 * Builders for schema.org JSON-LD objects. Render them with
 * `<JsonLd data={...} />`.
 */

type JsonLdObject = Record<string, unknown>;

const organizationId = `${siteConfig.url}/#organization`;
const websiteId = `${siteConfig.url}/#website`;

export function organizationSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.svg"),
    email: siteConfig.email,
    sameAs: socialLinks.map((s) => s.href),
  };
}

export function websiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@id": organizationId },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/tools?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface BreadcrumbEntry {
  name: string;
  href: string;
}

export function breadcrumbSchema(items: BreadcrumbEntry[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function articleSchema(
  content: Article | Guide,
  author: Author,
  path: string,
  image: string,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    description: content.excerpt,
    image: [absoluteUrl(image)],
    datePublished: content.publishedAt,
    dateModified: content.updatedAt ?? content.publishedAt,
    author: { "@type": "Organization", name: author.name, url: absoluteUrl("/about") },
    publisher: { "@id": organizationId, "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    keywords: content.tags.join(", "),
  };
}

const applicationCategory: Record<AITool["category"], string> = {
  "ai-writing": "BusinessApplication",
  "ai-image-generation": "MultimediaApplication",
  "ai-video": "MultimediaApplication",
  "ai-coding": "DeveloperApplication",
  "ai-productivity": "BusinessApplication",
  "ai-marketing": "BusinessApplication",
  "ai-automation": "BusinessApplication",
  "ai-business-tools": "BusinessApplication",
};

/**
 * Third-party tools: we describe the product without `offers` or ratings,
 * because we don't publish verified prices or review scores.
 */
export function toolSoftwareSchema(tool: AITool): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: applicationCategory[tool.category],
    operatingSystem: tool.platforms.join(", "),
    url: tool.website,
    publisher: { "@type": "Organization", name: tool.developer },
  };
}

/** Our own utilities are genuinely free, so a zero-price offer is accurate. */
export function utilitySoftwareSchema(utility: Utility): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: utility.name,
    description: utility.description,
    url: absoluteUrl(`/free-ai-tools/${utility.slug}`),
    applicationCategory: utility.group === "Developer" ? "DeveloperApplication" : "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: { "@id": organizationId },
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function itemListSchema(name: string, items: { name: string; href: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.href),
    })),
  };
}

/**
 * Our own automation services. Prices are indicative "from" prices, so they
 * are expressed as a minimum price rather than a fixed offer price.
 */
export function servicesSchema(
  services: { title: string; summary: string }[],
  packages: { name: string; fromPrice: number }[],
  description: string,
): JsonLdObject {
  const url = absoluteUrl("/services");
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: "AI & Workflow Automation Services",
    serviceType: "Business process automation",
    description,
    url,
    provider: { "@id": organizationId, "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Automation services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.summary },
      })),
    },
    offers: packages.map((p) => ({
      "@type": "Offer",
      name: `${p.name} package`,
      url: `${url}#pricing`,
      priceCurrency: "USD",
      priceSpecification: { "@type": "PriceSpecification", minPrice: p.fromPrice, priceCurrency: "USD" },
    })),
  };
}
