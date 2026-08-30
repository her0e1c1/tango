import type { Page } from "@playwright/test";

import { readLocalData, requireDocument, type StudySessionFixture } from "./fixtures";

export const progressOf = (card: { score: number; numberOfSeen: number }) => ({
  score: card.score,
  numberOfSeen: card.numberOfSeen,
});

export const readProgress = async (cardId: string) => {
  const document = await requireDocument("card", cardId);
  return {
    score: Number(document.fields.score?.integerValue),
    numberOfSeen: Number(document.fields.numberOfSeen?.integerValue),
  };
};

export const readSession = async (page: Page, deckId: string) => {
  const { sessionsByDeckId } = await readLocalData(page);
  return sessionsByDeckId[deckId] as StudySessionFixture | undefined;
};
