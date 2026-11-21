import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Renders the small inline-markdown subset used in content strings:
 * `**bold**`, `` `code` `` and `[label](href)`. Everything else is plain
 * text, so content can never inject HTML.
 */
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function isSafeHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("#") || /^https?:\/\//.test(href) || href.startsWith("mailto:");
}

export function RichText({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      if (!isSafeHref(href)) return <Fragment key={i}>{label}</Fragment>;
      if (href.startsWith("/") || href.startsWith("#")) {
        return (
          <Link key={i} href={href}>
            {label}
          </Link>
        );
      }
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
