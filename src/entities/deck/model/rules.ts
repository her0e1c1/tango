import type { Card } from "@/entities/card/@x/deck";
import { createStudyProgressFromCard, isStudyProgressEligible } from "@/entities/study-progress/@x/deck";

import type { Category, Deck, DeckId, DeckStore, DeckView } from "./types";

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

/** Keep persistence metadata and mutable store collections behind the Entity boundary. */
export const toDeckView = (deck: DeckStore): DeckView => ({
  id: deck.id,
  name: deck.name,
  ...(deck.url === undefined ? {} : { url: deck.url }),
  isPublic: deck.isPublic,
  scoreMax: deck.scoreMax,
  scoreMin: deck.scoreMin,
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
  category: deck.category,
  convertToBr: deck.convertToBr,
  createdAt: deck.createdAt,
  updatedAt: deck.updatedAt,
  localMode: deck.localMode,
});

const isCardMatchingTags = (card: Card, deck: Pick<Deck, "selectedTags" | "tagAndFilter">) => {
  const tags = deck.selectedTags;
  if (tags.length === 0) return true;
  if (deck.tagAndFilter) return tags.every((tag) => card.tags.includes(tag));
  return tags.some((tag) => card.tags.includes(tag));
};

export const filterCardsForDeck = <TCard extends Card>(
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

export const mustFindDeckById = (decks: readonly Deck[], id: DeckId): Deck => {
  const deck = decks.find((candidate) => candidate.id === id);

  if (deck == null) throw new Error(`Deck not found: ${id}`);

  return deck;
};
