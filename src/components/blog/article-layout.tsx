import { ArrowLeft, ArrowRight, CalendarDays, Clock, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/shared/badge";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { Newsletter } from "@/components/shared/newsletter";
import { ShareLinks } from "@/components/shared/share-links";
import { TableOfContents } from "@/components/shared/table-of-contents";
import { ToolLogo } from "@/components/tools/tool-logo";
import type { BreadcrumbEntry } from "@/lib/schema";
import { absoluteUrl } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import type { AITool, Author, ContentSection } from "@/types";
import { ContentCard, type ContentCardData } from "./article-card";

interface AdjacentLink {
  href: string;
  title: string;
}

/** Shared long-form layout for blog articles and how-to guides. */
export function ArticleLayout({
  path,
  title,
  excerpt,
  categoryLabel,
  categoryHref,
  cover,
  author,
  publishedAt,
  updatedAt,
  readingTime,
  intro,
  sections,
  breadcrumbs,
  related,
  relatedTitle,
  tools,
  previous,
  next,
  beforeContent,
  afterContent,
  tags,
}: {
  path: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  categoryHref: string;
  cover: string;
  author: Author;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  intro: string;
  sections: ContentSection[];
  breadcrumbs: BreadcrumbEntry[];
  related: ContentCardData[];
  relatedTitle: string;
  tools: AITool[];
  previous?: AdjacentLink;
  next?: AdjacentLink;
  beforeContent?: ReactNode;
  /** Rendered after the body and tags, before the share box. */
  afterContent?: ReactNode;
  tags: string[];
}) {
  const url = absoluteUrl(path);
  return (
    <article>
      <header className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgb(109_74_255/0.14),transparent)]" />
        <div className="container-site max-w-4xl pt-10 text-center">
          <Breadcrumbs items={breadcrumbs} className="flex animate-fade-up justify-center" />
          <Link href={categoryHref} className="mt-8 inline-block animate-fade-up">
            <Badge tone="primary">{categoryLabel}</Badge>
          </Link>
          <h1 className="mx-auto mt-5 max-w-3xl animate-fade-up text-4xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance [animation-delay:60ms] sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl animate-fade-up text-lg leading-relaxed text-muted-foreground [animation-delay:120ms]">{excerpt}</p>
          <div className="mt-7 flex animate-fade-up flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground [animation-delay:180ms]">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white" aria-hidden="true">
                W
              </span>
              <span>
                By <Link href="/about" className="font-medium text-foreground hover:text-primary">{author.name}</Link>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            </span>
            {updatedAt && updatedAt !== publishedAt && (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Updated <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" /> {readingTime} min read
            </span>
          </div>
        </div>
        <div className="container-site mt-10 max-w-5xl">
          <div className="relative aspect-[1200/630] animate-fade-up overflow-hidden rounded-[1.5rem] border border-border shadow-lift [animation-delay:200ms]">
            <Image src={cover} alt={`Illustration for “${title}”`} fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
          </div>
        </div>
      </header>

      <div className="container-site mt-14 grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_15rem]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <TableOfContents items={sections.map((s) => ({ id: s.id, heading: s.heading }))} />
          </div>
        </aside>

        <div className="min-w-0 max-w-3xl">
          {beforeContent}
          <ContentRenderer intro={intro} sections={sections} />

          {tags.length > 0 && (
            <ul className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
              {tags.map((t) => (
                <li key={t}>
                  <Badge>#{t}</Badge>
                </li>
              ))}
            </ul>
          )}

          {afterContent && <div className="mt-10">{afterContent}</div>}

          <div className="mt-10 flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Found this useful?</p>
              <p className="text-sm text-muted-foreground">Share it with your team.</p>
            </div>
            <ShareLinks url={url} title={title} />
          </div>

          <div className="mt-6 flex gap-4 rounded-[var(--radius-card)] border border-border bg-surface-muted/40 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-semibold text-white" aria-hidden="true">
              W
            </span>
            <div>
              <p className="font-semibold text-foreground">{author.name}</p>
              <p className="text-xs text-muted-foreground">{author.role}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{author.bio}</p>
            </div>
          </div>

          {(previous || next) && (
            <nav aria-label="More posts" className="mt-10 grid gap-4 sm:grid-cols-2">
              {previous ? (
                <Link href={previous.href} className="group rounded-[var(--radius-card)] border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Previous
                  </span>
                  <span className="mt-2 block font-medium leading-snug text-foreground group-hover:text-primary">{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={next.href} className="group rounded-[var(--radius-card)] border border-border bg-surface p-5 text-right transition-all hover:-translate-y-0.5 hover:border-primary/40">
                  <span className="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground">
                    Next <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                  <span className="mt-2 block font-medium leading-snug text-foreground group-hover:text-primary">{next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-28 space-y-6">
            {tools.length > 0 && (
              <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tools mentioned</p>
                <ul className="mt-4 space-y-3">
                  {tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link href={`/tools/${tool.slug}`} className="group flex items-center gap-3">
                        <ToolLogo tool={tool} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">{tool.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{tool.pricing}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Share</p>
              <ShareLinks url={url} title={title} />
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-site mt-24" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            {relatedTitle}
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ContentCard key={item.href} item={item} />
            ))}
          </div>
        </section>
      )}

      <Newsletter />
    </article>
  );
}
