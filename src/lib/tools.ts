import { tools } from "@/data/tools";
import type { AITool, ToolCategorySlug } from "@/types";

/** Query helpers over the static tools data. Swap for DB queries later. */

export function getTool(slug: string): AITool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsBySlugs(slugs: string[]): AITool[] {
  return slugs.map(getTool).filter((t): t is AITool => Boolean(t));
}

export function getFeaturedTools(): AITool[] {
  return tools.filter((t) => t.featured).sort((a, b) => a.popularityRank - b.popularityRank);
}

export function getPopularTools(limit = 6): AITool[] {
  return [...tools].sort((a, b) => a.popularityRank - b.popularityRank).slice(0, limit);
}

export function getNewestTools(limit = 6): AITool[] {
  return [...tools].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, limit);
}

export function getToolsInCategory(category: ToolCategorySlug): AITool[] {
  return tools
    .filter((t) => t.category === category || t.secondaryCategories?.includes(category))
    .sort((a, b) => a.popularityRank - b.popularityRank);
}

export function countToolsInCategory(category: ToolCategorySlug): number {
  return getToolsInCategory(category).length;
}

/** Tools sharing a category, excluding listed alternatives and the tool itself. */
export function getRelatedTools(tool: AITool, limit = 3): AITool[] {
  return tools
    .filter((t) => t.slug !== tool.slug && !tool.alternatives.includes(t.slug))
    .filter(
      (t) =>
        t.category === tool.category ||
        t.secondaryCategories?.includes(tool.category) ||
        tool.secondaryCategories?.includes(t.category),
    )
    .sort((a, b) => a.popularityRank - b.popularityRank)
    .slice(0, limit);
}
