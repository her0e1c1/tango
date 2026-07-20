/**
 * @file Provides small, general-purpose helpers shared by otherwise unrelated features.
 * These functions keep common type checks and category selection rules in one place.
 */

import * as C from "@/constant";

/**
 * Checks whether a value is present rather than `undefined`.
 * TypeScript can narrow the value's type after this check succeeds.
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

type NonEmptyArray<T> = [T, ...T[]];

/**
 * Checks whether an array exists and contains at least one item.
 * A successful check also tells TypeScript that the first item can be read safely.
 */
export function isNonEmpty<A>(arr?: A[]): arr is NonEmptyArray<A> {
  return arr != null && arr.length > 0;
}

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
