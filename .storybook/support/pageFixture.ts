/** @file Defines deterministic application data shared by route-level Storybook stories. */

import type { CardId, RemoteCard } from "@/entities/card";
import type { DeckId, RemoteDeck } from "@/entities/deck";

import { createCard, createDeck, createPreferences, createStudyProgress } from "@/test/factories";
import { STORYBOOK_DECK_IMPORT_URL } from "@/storybook/handlers";
import { PAGE_STORY_UID, type PageStoryParameters } from "@/storybook/PageDecorator";

export const PAGE_STORY_DECK_ID: DeckId = "storybook-japanese";
const PAGE_STORY_SECONDARY_DECK_ID: DeckId = "storybook-math";
export const PAGE_STORY_CARD_ID: CardId = "storybook-hello";

const timestamp = Date.UTC(2026, 6, 1, 9, 0, 0);

const pageStoryDecks: RemoteDeck[] = [
  createDeck({
    id: PAGE_STORY_DECK_ID,
    uid: PAGE_STORY_UID,
    name: "Japanese starter",
    category: "markdown",
    selectedTags: ["greeting"],
    url: STORYBOOK_DECK_IMPORT_URL,
    createdAt: timestamp - 14 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp,
  }),
  createDeck({
    id: PAGE_STORY_SECONDARY_DECK_ID,
    uid: PAGE_STORY_UID,
    name: "Everyday mathematics",
    category: "math",
    createdAt: timestamp - 30 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 24 * 60 * 60 * 1000,
  }),
];

const pageStoryCards: RemoteCard[] = [
  createCard({
    id: PAGE_STORY_CARD_ID,
    deckId: PAGE_STORY_DECK_ID,
    uid: PAGE_STORY_UID,
    frontText: "Hello",
    backText: "こんにちは",
    tags: ["greeting"],
    uniqueKey: "storybook-hello",
    createdAt: timestamp - 10 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp,
  }),
  createCard({
    id: "storybook-good-morning",
    deckId: PAGE_STORY_DECK_ID,
    uid: PAGE_STORY_UID,
    frontText: "Good morning",
    backText: "おはようございます",
    tags: ["greeting", "polite"],
    uniqueKey: "storybook-good-morning",
    createdAt: timestamp - 9 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 60 * 60 * 1000,
  }),
  createCard({
    id: "storybook-thank-you",
    deckId: PAGE_STORY_DECK_ID,
    uid: PAGE_STORY_UID,
    frontText: "Thank you",
    backText: "ありがとうございます",
    tags: ["polite"],
    uniqueKey: "storybook-thank-you",
    createdAt: timestamp - 8 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 2 * 60 * 60 * 1000,
  }),
  createCard({
    id: "storybook-circle-area",
    deckId: PAGE_STORY_SECONDARY_DECK_ID,
    uid: PAGE_STORY_UID,
    frontText: "What is the area of a circle with radius r?",
    backText: "$\\pi r^2$",
    tags: ["geometry"],
    uniqueKey: "storybook-circle-area",
    createdAt: timestamp - 20 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 3 * 24 * 60 * 60 * 1000,
  }),
];

const pageStoryProgresses = [
  createStudyProgress({ cardId: PAGE_STORY_CARD_ID, score: 3, numberOfSeen: 8 }),
  createStudyProgress({ cardId: "storybook-good-morning", score: 1, numberOfSeen: 4 }),
  createStudyProgress({ cardId: "storybook-thank-you", numberOfSeen: 2 }),
  createStudyProgress({ cardId: "storybook-circle-area" }),
];

export const pageStoryState = {
  decks: pageStoryDecks,
  cards: pageStoryCards,
  progresses: pageStoryProgresses,
  preferences: createPreferences({
    maxNumberOfCardsToLearn: 20,
    showScoreSlider: true,
  }),
  sessionsByDeckId: {
    [PAGE_STORY_DECK_ID]: {
      deckId: PAGE_STORY_DECK_ID,
      cardOrderIds: pageStoryCards.filter((card) => card.deckId === PAGE_STORY_DECK_ID).map((card) => card.id),
      currentIndex: 1,
      lastStudiedAt: timestamp - 30 * 60 * 1000,
    },
  },
} satisfies Omit<PageStoryParameters, "path">;
