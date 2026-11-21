import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalized === "/" ? "" : normalized}`;
}

interface CreateMetadataOptions {
  title: string;
  description: string;
  /** Path of the page, e.g. `/tools/chatgpt`. Used for the canonical URL. */
  path: string;
  image?: { url: string; alt: string };
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  /** Set for pages that must not be indexed (e.g. the admin dashboard). */
  noIndex?: boolean;
  /** Use the title verbatim instead of applying the site title template. */
  absoluteTitle?: boolean;
}

/**
 * Builds consistent per-page metadata: title, description, canonical URL,
 * Open Graph and Twitter cards. When no image is passed, the root
 * `opengraph-image` route is inherited.
 */
export function createMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  tags,
  noIndex,
  absoluteTitle,
}: CreateMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  const images = image ? [{ url: absoluteUrl(image.url), alt: image.alt, width: 1200, height: 630 }] : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      ...(images && { images }),
      ...(type === "article" && { publishedTime, modifiedTime, authors, tags }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      site: siteConfig.twitterHandle,
      ...(images && { images: images.map((i) => i.url) }),
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}
