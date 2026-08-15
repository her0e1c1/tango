import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { deckSchema } from "./schema";
import type { Deck } from "./types";

interface DeckState {
  remoteDecks: Deck[];
  localDecks: Deck[];
}

type PersistedDeckState = Pick<DeckState, "localDecks">;

export const deckStore = createStore<DeckState>()(
  persist<DeckState, [], [], PersistedDeckState>(() => ({ remoteDecks: [], localDecks: [] }), {
    name: "tango-local-decks",
    partialize: ({ localDecks }) => ({ localDecks }),
    merge: (persisted, current) => {
      const result = deckSchema.array().safeParse((persisted as Partial<DeckState> | undefined)?.localDecks);
      return result.success ? { ...current, localDecks: result.data.filter((deck) => deck.localMode) } : current;
    },
  })
);

export const replaceRemoteDecks = (remoteDecks: Deck[]): void => {
  deckStore.setState({ remoteDecks });
};

export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};

export const replaceLocalDecks = (localDecks: Deck[]): void => {
  deckStore.setState({ localDecks });
};
