import type { Page } from "@playwright/test";

import { readLocalData, listDocuments, type StudySessionFixture } from "./fixtures";

export const readProgress = async (cardId: string) => {
  const documents = await listDocuments("cardStudyState");
  const state = documents.find((document) => document.fields.cardId?.stringValue === cardId);
  return { reps: Number(state?.fields.fsrs?.mapValue?.fields?.reps?.integerValue ?? 0) };
};

export const readSession = async (page: Page, deckId: string) => {
  const { sessionsByDeckId } = await readLocalData(page);
  return sessionsByDeckId[deckId] as StudySessionFixture | undefined;
};
