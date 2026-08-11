/**
 * @file Owns deck category values and the rule for resolving a card's effective category.
 * Category aliases and supported languages live with the Deck domain instead of root-level helpers.
 */

export type Category = string;

export const LANGUAGES: Category[] = [
  "c",
  "cpp",
  "kotlin",
  "python",
  "golang",
  "java",
  "javascript",
  "typescript",
  "haskell",
  "php",
  "ruby",
  "shell",
  "sh",
  "swift",
];

const LANGUAGE_MAPPING = {
  hs: "haskell",
  go: "golang",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
} as const;

type LanguageAlias = keyof typeof LANGUAGE_MAPPING;

const isLanguageAlias = (value: string): value is LanguageAlias => value in LANGUAGE_MAPPING;

export const CATEGORY: Category[] = ["raw", "markdown", "math", ...LANGUAGES];

/**
 * Resolves the category used to render a card.
 * The first supported tag overrides the deck's default category, including shorthand language tags.
 */
export const getCategory = (category: Category, tags: string[]): Category => {
  const tagCategory = tags
    .map((tag) => (isLanguageAlias(tag) ? LANGUAGE_MAPPING[tag] : tag))
    .find((tag) => CATEGORY.includes(tag));

  return tagCategory ?? category;
};
