import type { Category, DeckDomain, DeckId } from "./types";

const APPLICATION_CATEGORIES: Category[] = ["raw", "math"];

const MAJOR_LANGUAGES: Category[] = [
  "c",
  "cpp",
  "csharp",
  "cs",
  "css",
  "go",
  "golang",
  "html",
  "java",
  "javascript",
  "js",
  "jsx",
  "json",
  "kotlin",
  "markdown",
  "md",
  "php",
  "python",
  "py",
  "ruby",
  "rb",
  "rust",
  "shell",
  "sh",
  "bash",
  "sql",
  "swift",
  "typescript",
  "ts",
  "tsx",
  "yaml",
  "yml",
  "haskell",
  "hs",
];

export const CATEGORY: Category[] = [...new Set([...APPLICATION_CATEGORIES, ...MAJOR_LANGUAGES])];

// Reports whether a category names a language alias supported by syntax highlighting.
export const isHighlightLanguage = (category: Category): boolean => MAJOR_LANGUAGES.includes(category);

// Uses the first supported tag as the rendering category and falls back to the Deck category when none qualifies.
export const getCategory = (category: Category, tags: string[]): Category => {
  const tagCategory = tags.find((tag) => APPLICATION_CATEGORIES.includes(tag) || isHighlightLanguage(tag));

  return tagCategory ?? category;
};

// Applies the Deck's all-or-any tag mode; an empty selection deliberately accepts every tag set.
export const isDeckTagSelectionMatching = (
  candidateTags: readonly string[],
  deck: Pick<DeckDomain, "selectedTags" | "tagAndFilter">
): boolean => {
  const tags = deck.selectedTags;
  if (tags.length === 0) return true;
  if (deck.tagAndFilter) return tags.every((tag) => candidateTags.includes(tag));
  return tags.some((tag) => candidateTags.includes(tag));
};

// Returns the requested Deck or throws when a caller's Deck reference no longer resolves.
export const mustFindDeckById = <TDeck extends DeckDomain>(decks: readonly TDeck[], id: DeckId): TDeck => {
  const deck = decks.find((candidate) => candidate.id === id);

  if (deck == null) throw new Error(`Deck not found: ${id}`);

  return deck;
};
