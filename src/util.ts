import * as C from "src/constant";

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

type NonEmptyArray<T> = [T, ...T[]];

export function isNonEmpty<A>(arr?: A[]): arr is NonEmptyArray<A> {
  return arr != null && arr.length > 0;
}

export const getCategory = (category: string, tags: string[]) => {
  tags = tags.map((tag) => (C.CanMapping(tag) ? C.MAPPING[tag] : tag)).filter((tag) => C.CATEGORY.includes(tag));
  if (tags.length > 0) {
    return tags[0];
  }
  return category;
};
