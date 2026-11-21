"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { SocialIcon } from "./social-icons";

/** Share links use each network's public share URL — no tracking scripts. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { platform: "x" as const, label: "Share on X", href: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}` },
    {
      platform: "linkedin" as const,
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const itemClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary";

  return (
    <div className="flex items-center gap-2">
      {links.map((l) => (
        <a key={l.platform} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} className={itemClass}>
          <SocialIcon platform={l.platform} />
        </a>
      ))}
      <button type="button" onClick={copy} className={itemClass} aria-label={copied ? "Link copied" : "Copy link"}>
        {copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
