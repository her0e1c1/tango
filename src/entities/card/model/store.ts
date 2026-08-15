import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import {
  cardIdSchema,
  localCardCreateSchema,
  localCardEditSchema,
  localCardSchema,
  persistedCardSchema,
} from "./schema";
import type { Card, CardId, LocalCard, LocalCardCreateInput, LocalCardEdit, RemoteCard } from "./types";

type LocalCardStudyProgressEdit = Pick<LocalCard, "id"> &
  Partial<Pick<LocalCard, "score" | "numberOfSeen" | "lastSeenAt" | "nextSeeingAt" | "interval">>;

interface CardState {
  remoteCards: RemoteCard[];
  localCards: LocalCard[];
}

interface PersistedCardState {
  localCards: LocalCard[];
}

interface CreateCardStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

const persistedCardStateSchema = z.object({ localCards: z.array(persistedCardSchema) });

const parsePersistedCardState = (value: unknown): PersistedCardState => {
  const result = persistedCardStateSchema.safeParse(value);
  return result.success ? result.data : { localCards: [] };
};

const createCardStore = ({ storage, skipHydration }: CreateCardStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedCardState>(() => storage ?? localStorage);
  return createStore<CardState>()(
    persist<CardState, [], [], PersistedCardState>(() => ({ remoteCards: [], localCards: [] }), {
      name: "tango-local-cards",
      version: 1,
      ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
      ...(skipHydration !== undefined ? { skipHydration } : {}),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedCardState(persistedState),
      }),
      partialize: ({ localCards }) => ({ localCards }),
    })
  );
};

export const cardStore = createCardStore();

export const replaceRemoteCards = (remoteCards: RemoteCard[]): void => {
  cardStore.setState({ remoteCards });
};

export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};

export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  const state = cardStore.getState();
  return state.remoteCards.find((card) => card.id === cardId) ?? state.localCards.find((card) => card.id === cardId);
};

export const createLocalCard = (input: LocalCardCreateInput): LocalCard => {
  const card = localCardCreateSchema.parse(input);
  const timestamp = Date.now();
  const createdCard = localCardSchema.parse({ ...card, createdAt: timestamp, updatedAt: timestamp });
  const localCards = cardStore.getState().localCards.filter(({ id }) => id !== createdCard.id);
  cardStore.setState({ localCards: [...localCards, createdCard] });
  return createdCard;
};

export const editLocalCard = (input: LocalCardEdit): LocalCard => {
  const edit = localCardEditSchema.parse(input);
  const { localCards } = cardStore.getState();
  const currentCard = localCards.find(({ id }) => id === edit.id);
  if (currentCard === undefined) throw new Error(`Local Card "${edit.id}" was not found`);

  const updatedCard = localCardSchema.parse({ ...currentCard, ...edit, updatedAt: Date.now() });
  cardStore.setState({ localCards: localCards.map((card) => (card.id === updatedCard.id ? updatedCard : card)) });
  return updatedCard;
};

export const editLocalCardStudyProgress = (input: LocalCardStudyProgressEdit): LocalCard => {
  const cardId = cardIdSchema.parse(input.id);
  const { localCards } = cardStore.getState();
  const currentCard = localCards.find(({ id }) => id === cardId);
  if (currentCard === undefined) throw new Error(`Local Card "${cardId}" was not found`);

  const updatedCard = localCardSchema.parse({ ...currentCard, ...input, updatedAt: Date.now() });
  cardStore.setState({ localCards: localCards.map((card) => (card.id === cardId ? updatedCard : card)) });
  return updatedCard;
};

export const deleteLocalCard = (input: CardId): void => {
  const cardId = cardIdSchema.parse(input);
  cardStore.setState({ localCards: cardStore.getState().localCards.filter(({ id }) => id !== cardId) });
};

export const deleteLocalCardsByDeckId = (deckId: string): CardId[] => {
  const parsedDeckId = z.string().min(1, "Card deck is required").parse(deckId);
  const deletedCardIds = cardStore
    .getState()
    .localCards.filter((card) => card.deckId === parsedDeckId)
    .map((card) => card.id);
  cardStore.setState({ localCards: cardStore.getState().localCards.filter((card) => card.deckId !== parsedDeckId) });
  return deletedCardIds;
};
