import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import { cardCreateSchema, cardEditSchema, cardIdSchema, cardSchema, persistedCardSchema } from "./schema";
import type { Card, CardCreateInput, CardEdit, CardId } from "./types";

interface CardState {
  remoteCards: Card[];
  localCards: Card[];
}

interface PersistedCardState {
  localCards: Card[];
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
      migrate: parsePersistedCardState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedCardState(persistedState),
      }),
      partialize: ({ localCards }) => ({ localCards }),
    })
  );
};

export const cardStore = createCardStore();

export const replaceRemoteCards = (remoteCards: Card[]): void => {
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

export const createLocalCard = (input: CardCreateInput): Card => {
  const card = cardCreateSchema.parse(input);
  const timestamp = Date.now();
  const createdCard = cardSchema.parse({ ...card, createdAt: timestamp, updatedAt: timestamp });
  const localCards = cardStore.getState().localCards.filter(({ id }) => id !== createdCard.id);
  cardStore.setState({ localCards: [...localCards, createdCard] });
  return createdCard;
};

export const editLocalCard = (input: CardEdit): Card => {
  const edit = cardEditSchema.parse(input);
  const localCards = cardStore.getState().localCards;
  const currentCard = localCards.find(({ id }) => id === edit.id);
  if (currentCard === undefined) throw new Error(`Local Card "${edit.id}" was not found`);

  const updatedCard = cardSchema.parse({ ...currentCard, ...edit, updatedAt: Date.now() });
  cardStore.setState({ localCards: localCards.map((card) => (card.id === updatedCard.id ? updatedCard : card)) });
  return updatedCard;
};

export const deleteLocalCard = (input: CardId): void => {
  const cardId = cardIdSchema.parse(input);
  cardStore.setState({ localCards: cardStore.getState().localCards.filter(({ id }) => id !== cardId) });
};

export const deleteLocalCardsByDeckId = (deckId: string): void => {
  const parsedDeckId = z.string().min(1, "Card deck is required").parse(deckId);
  cardStore.setState({ localCards: cardStore.getState().localCards.filter((card) => card.deckId !== parsedDeckId) });
};
