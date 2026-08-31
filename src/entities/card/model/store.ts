import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import {
  cardDeckIdSchema,
  cardIdSchema,
  localCardCreateSchema,
  localCardEditSchema,
  localCardSchema,
  persistedCardStateSchema,
} from "./schema";
import type {
  Card,
  CardId,
  LocalCard,
  LocalCardCreateInput,
  LocalCardEdit,
  PersistedCardState,
  RemoteCard,
} from "./types";

/** Live Card collections separated by remote and local persistence ownership. */
interface CardState {
  remoteCards: RemoteCard[];
  localCards: LocalCard[];
}

/** Learning fields embedded in a browser-persisted Card until local StudyProgress has its own store. */
type LocalCardStudyProgressEdit = Pick<LocalCard, "id"> &
  Partial<Pick<LocalCard, "difficulty" | "numberOfSeen" | "lastSeenAt" | "nextSeeingAt" | "interval">>;

/** Injectable persistence controls used to create an isolated Card store. */
interface CreateCardStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

// Reject the stored collection as a unit so live state never mixes validated Cards with an incompatible payload.
const parsePersistedCardState = (value: unknown): PersistedCardState => {
  const result = persistedCardStateSchema.safeParse(value);
  return result.success ? result.data : { localCards: [] };
};

// Creates a Card store whose durable state contains only validated local Cards.
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
      // Remote Cards belong to the active subscription and must not survive authentication changes in browser storage.
      partialize: ({ localCards }) => ({ localCards }),
    })
  );
};

export const cardStore = createCardStore();

// Replaces the remote Card snapshot published by the active subscription.
export const replaceRemoteCards = (remoteCards: RemoteCard[]): void => {
  cardStore.setState({ remoteCards });
};

// Clears all remote Cards when their authentication scope ends.
export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};

// Finds one Card across remote and local collections after validating its identifier.
export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  const state = cardStore.getState();
  return state.remoteCards.find((card) => card.id === cardId) ?? state.localCards.find((card) => card.id === cardId);
};

// Creates and persists a local Card with Entity-owned timestamps.
export const createLocalCard = (input: LocalCardCreateInput): LocalCard => {
  const card = localCardCreateSchema.parse(input);
  const timestamp = Date.now();
  const createdCard = localCardSchema.parse({ ...card, createdAt: timestamp, updatedAt: timestamp });
  // Treat a retried create as an upsert by id so persisted local data cannot accumulate duplicate Cards.
  const localCards = cardStore.getState().localCards.filter(({ id }) => id !== createdCard.id);
  cardStore.setState({ localCards: [...localCards, createdCard] });
  return createdCard;
};

// Applies a validated partial edit to an existing local Card.
export const editLocalCard = (input: LocalCardEdit): LocalCard => {
  const edit = localCardEditSchema.parse(input);
  const { localCards } = cardStore.getState();
  const currentCard = localCards.find(({ id }) => id === edit.id);
  if (currentCard === undefined) throw new Error(`Local Card "${edit.id}" was not found`);

  const updatedCard = localCardSchema.parse({ ...currentCard, ...edit, updatedAt: Date.now() });
  cardStore.setState({ localCards: localCards.map((card) => (card.id === updatedCard.id ? updatedCard : card)) });
  return updatedCard;
};

// Persists local learning progress with the Card while keeping content edits behind their narrower schema.
export const editLocalCardStudyProgress = (input: LocalCardStudyProgressEdit): LocalCard => {
  const cardId = cardIdSchema.parse(input.id);
  const { localCards } = cardStore.getState();
  const currentCard = localCards.find(({ id }) => id === cardId);
  if (currentCard === undefined) throw new Error(`Local Card "${cardId}" was not found`);

  const updatedCard = localCardSchema.parse({ ...currentCard, ...input, updatedAt: Date.now() });
  const updatedLocalCards = localCards.map((card) => (card.id === cardId ? updatedCard : card));
  try {
    cardStore.setState({ localCards: updatedLocalCards });
  } catch (error) {
    // Zustand publishes before persisting; roll back only our still-live replacement so retries cannot compound it.
    const liveLocalCards = cardStore.getState().localCards;
    if (liveLocalCards.some((card) => card === updatedCard)) {
      try {
        cardStore.setState({
          localCards: liveLocalCards.map((card) => (card === updatedCard ? currentCard : card)),
        });
      } catch {
        // The rollback reaches memory before its persistence attempt, even while browser storage remains unavailable.
      }
    }
    throw error;
  }
  return updatedCard;
};

// Removes one local Card after validating its identifier.
export const deleteLocalCard = (input: CardId): void => {
  const cardId = cardIdSchema.parse(input);
  cardStore.setState({ localCards: cardStore.getState().localCards.filter(({ id }) => id !== cardId) });
};

// Removes every local Card owned by a deleted Deck.
export const deleteLocalCardsByDeckId = (deckId: string): void => {
  const parsedDeckId = cardDeckIdSchema.parse(deckId);
  cardStore.setState({ localCards: cardStore.getState().localCards.filter((card) => card.deckId !== parsedDeckId) });
};
