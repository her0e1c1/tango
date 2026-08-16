import type { Card } from "@/entities/card/@x/deck";
import { createStudyProgressFromCard, isStudyProgressEligible } from "@/entities/study-progress/@x/deck";

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

// Applies the Deck's all-or-any tag mode; an empty selection deliberately leaves every Card eligible.
const isCardMatchingTags = (card: Card, deck: Pick<DeckDomain, "selectedTags" | "tagAndFilter">) => {
  const tags = deck.selectedTags;
  if (tags.length === 0) return true;
  if (deck.tagAndFilter) return tags.every((tag) => card.tags.includes(tag));
  return tags.some((tag) => card.tags.includes(tag));
};

// Selects Cards that satisfy tag, score, and optional due-time rules while preserving the caller's order.
export const filterCardsForDeck = <TCard extends Card>(
  cards: TCard[],
  deck: Pick<DeckDomain, "selectedTags" | "tagAndFilter" | "scoreMax" | "scoreMin">,
  study: { useCardInterval: boolean },
  now = Date.now()
): TCard[] =>
  cards.filter((card) => {
    if (!isCardMatchingTags(card, deck)) return false;
    return isStudyProgressEligible(
      createStudyProgressFromCard(card),
      {
        maximumScore: deck.scoreMax,
        minimumScore: deck.scoreMin,
        respectNextSeeingAt: study.useCardInterval,
      },
      now
    );
  });

// Returns the requested Deck or throws when a caller's Deck reference no longer resolves.
export const mustFindDeckById = <TDeck extends DeckDomain>(decks: readonly TDeck[], id: DeckId): TDeck => {
  const deck = decks.find((candidate) => candidate.id === id);

  if (deck == null) throw new Error(`Deck not found: ${id}`);

  return deck;
};
