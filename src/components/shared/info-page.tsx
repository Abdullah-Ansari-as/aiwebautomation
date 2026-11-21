import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getInfoPage, type InfoPage } from "@/data/legal";
import { createMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { ContentRenderer } from "./content-renderer";
import { PageHero } from "./page-hero";
import { TableOfContents } from "./table-of-contents";

export function infoPageMetadata(slug: InfoPage["slug"]): Metadata {
  const page = getInfoPage(slug);
  return createMetadata({ title: page.metaTitle, description: page.description, path: `/${page.slug}` });
}

/** Layout for policy and information pages driven by `src/data/legal.ts`. */
export function InfoPageView({ slug, children }: { slug: InfoPage["slug"]; children?: ReactNode }) {
  const page = getInfoPage(slug);
  return (
    <>
      <PageHero title={page.title} description={page.description} breadcrumbs={[{ name: page.title, href: `/${page.slug}` }]}>
        <p className="text-sm text-muted-foreground">
          Last updated <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time>
        </p>
      </PageHero>
      <div className="container-site grid gap-12 py-14 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <TableOfContents items={page.sections.map((s) => ({ id: s.id, heading: s.heading }))} />
          </div>
        </aside>
        <div className="min-w-0 max-w-3xl">
          {page.requiresLegalReview && (
            <p role="note" className="mb-10 flex gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm leading-relaxed text-foreground">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
              <span>
                <strong>Template notice:</strong> this page is a structured placeholder. Text in <strong>[brackets]</strong> must be
                completed, and the whole page should be reviewed by qualified legal counsel before launch.
              </span>
            </p>
          )}
          <ContentRenderer intro={page.intro} sections={page.sections} />
          {children}
        </div>
      </div>
    </>
  );
}
