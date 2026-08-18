import type { Card } from "@/entities/card/@x/deck";
import { isStudyProgressEligible, type StudyProgress } from "@/entities/study-progress/@x/deck";

import type { Category, Deck, DeckId } from "./types";

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
const isDeckTagSelectionMatching = (
  candidateTags: readonly string[],
  selectedTags: readonly string[],
  tagAndFilter: boolean
): boolean => {
  if (selectedTags.length === 0) return true;
  if (tagAndFilter) return selectedTags.every((tag) => candidateTags.includes(tag));
  return selectedTags.some((tag) => candidateTags.includes(tag));
};

// Missing progress stays excluded so incomplete or malformed records never become study entries.
export const selectStudyCards = (
  cards: readonly Card[],
  progresses: readonly StudyProgress[],
  deck: Pick<Deck, "scoreMax" | "scoreMin" | "selectedTags" | "tagAndFilter">,
  { useCardInterval, now }: { useCardInterval: boolean; now: number }
) => {
  const progressByCardId = new Map(progresses.map((progress) => [progress.cardId, progress]));
  const progressConstraints = {
    maximumScore: deck.scoreMax,
    minimumScore: deck.scoreMin,
    respectNextSeeingAt: useCardInterval,
  };

  return cards.flatMap((card) => {
    const progress = progressByCardId.get(card.id);
    return progress != null &&
      isDeckTagSelectionMatching(card.tags, deck.selectedTags, deck.tagAndFilter) &&
      isStudyProgressEligible(progress, progressConstraints, now)
      ? [{ card, progress }]
      : [];
  });
};

// Returns the requested Deck or throws when a caller's Deck reference no longer resolves.
export const mustFindDeckById = <TDeck extends { id: DeckId }>(decks: readonly TDeck[], id: DeckId): TDeck => {
  const deck = decks.find((candidate) => candidate.id === id);

  if (deck == null) throw new Error(`Deck not found: ${id}`);

  return deck;
};
