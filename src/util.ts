/**
 * @file Provides small, general-purpose helpers shared by otherwise unrelated features.
 * These functions keep common type checks and category selection rules in one place.
 */

import * as C from "@/constant";

/**
 * Chooses the effective category from an explicit value and the available tags.
 * This keeps category fallback behavior consistent wherever cards are grouped.
 */
export const getCategory = (category: string, tags: string[]) => {
  tags = tags.map((tag) => (C.CanMapping(tag) ? C.MAPPING[tag] : tag)).filter((tag) => C.CATEGORY.includes(tag));
  if (tags.length > 0) {
    return tags[0];
  }
  return category;
};
