/**
 * @file Owns deck category values and the rule for resolving a card's effective category.
 * Highlight.js is the source of truth for supported code-language categories.
 */

// biome-ignore lint/correctness/noUnresolvedImports: highlight.js exposes this default through its ESM export map.
import hljs from "highlight.js";

export type Category = string;

const APPLICATION_CATEGORIES: Category[] = ["raw", "math"];
const HIGHLIGHT_LANGUAGES = hljs.listLanguages();
const HIGHLIGHT_ALIASES = HIGHLIGHT_LANGUAGES.flatMap((language) => hljs.getLanguage(language)?.aliases ?? []);

export const CATEGORY: Category[] = [
  ...new Set([...APPLICATION_CATEGORIES, ...HIGHLIGHT_LANGUAGES, ...HIGHLIGHT_ALIASES]),
];

export const isHighlightLanguage = (category: Category): boolean => hljs.getLanguage(category) !== undefined;

/**
 * Resolves the category used to render a card.
 * The first supported application category or Highlight.js language/alias overrides the deck default.
 */
export const getCategory = (category: Category, tags: string[]): Category => {
  const tagCategory = tags.find((tag) => APPLICATION_CATEGORIES.includes(tag) || isHighlightLanguage(tag));

  return tagCategory ?? category;
};
