import type { Card } from "@/entities/card/@x/deck";
import {
  createStudyProgressFromCard,
  getNextStudyAvailabilityAt,
  isStudyProgressEligible,
} from "@/entities/study-progress/@x/deck";

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

export const isHighlightLanguage = (category: Category): boolean => MAJOR_LANGUAGES.includes(category);

export const getCategory = (category: Category, tags: string[]): Category => {
  const tagCategory = tags.find((tag) => APPLICATION_CATEGORIES.includes(tag) || isHighlightLanguage(tag));

  return tagCategory ?? category;
};

const isCardMatchingTags = (card: Card, deck: Pick<Deck, "selectedTags" | "tagAndFilter">) => {
  const tags = deck.selectedTags;
  if (tags.length === 0) return true;
  if (deck.tagAndFilter) return tags.every((tag) => card.tags.includes(tag));
  return tags.some((tag) => card.tags.includes(tag));
};

const filterCardsForDeck = <TCard extends Card>(
  cards: TCard[],
  deck: Pick<Deck, "selectedTags" | "tagAndFilter" | "scoreMax" | "scoreMin">,
  study: { useCardInterval: boolean },
  now: number
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

export const selectStudyCardsForDeck = <TCard extends Card>(
  cards: TCard[],
  deck: Deck | undefined,
  study: { useCardInterval: boolean },
  now: number
): { cards: TCard[]; nextAvailabilityAt: number | undefined } => ({
  cards: deck == null ? [] : filterCardsForDeck(cards, deck, study, now),
  nextAvailabilityAt: getNextStudyAvailabilityAt(cards, now),
});

export const mustFindDeckById = (decks: readonly Deck[], id: DeckId): Deck => {
  const deck = decks.find((candidate) => candidate.id === id);

  if (deck == null) throw new Error(`Deck not found: ${id}`);

  return deck;
};
