import type { Guide } from "@/types";
import { guideList } from "./content/guides-content";
import { readingTimeFromSections } from "@/lib/utils";

/** All how-to guides, newest first. */
export const guides: Guide[] = [...guideList].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export type GuideSummary = Omit<Guide, "sections" | "intro"> & {
  readingTime: number;
  cover: string;
  stepCount: number;
};

export function guideCover(slug: string): string {
  return `/images/guides/${slug}.webp`;
}

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export function toGuideSummary(guide: Guide): GuideSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sections, intro, ...rest } = guide;
  return {
    ...rest,
    readingTime: readingTimeFromSections(guide.intro, guide.sections),
    cover: guideCover(guide.slug),
    stepCount: guide.sections.filter((s) => /^step\s+\d+/i.test(s.heading)).length,
  };
}

export function getGuideSummaries(): GuideSummary[] {
  return guides.map(toGuideSummary);
}

export function getRelatedGuides(guide: Guide, limit = 3): Guide[] {
  return guides
    .filter((g) => g.slug !== guide.slug)
    .map((g) => ({ g, score: (g.category === guide.category ? 2 : 0) + g.tags.filter((t) => guide.tags.includes(t)).length }))
    .sort((x, y) => y.score - x.score || y.g.publishedAt.localeCompare(x.g.publishedAt))
    .slice(0, limit)
    .map((x) => x.g);
}

export function getAdjacentGuides(slug: string): { previous?: Guide; next?: Guide } {
  const index = guides.findIndex((g) => g.slug === slug);
  if (index === -1) return {};
  return { next: guides[index - 1], previous: guides[index + 1] };
}
