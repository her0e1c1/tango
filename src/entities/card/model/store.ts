import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import { cardSchema } from "./schema";
import type { Card } from "./types";

interface CardState {
  remoteCards: Card[];
  localCards: Card[];
}

type PersistedCardState = Pick<CardState, "localCards">;
const persistedCardSchema = cardSchema.extend({ nextSeeingAt: z.coerce.date().optional() });

export const cardStore = createStore<CardState>()(
  persist<CardState, [], [], PersistedCardState>(() => ({ remoteCards: [], localCards: [] }), {
    name: "tango-local-cards",
    partialize: ({ localCards }) => ({ localCards }),
    merge: (persisted, current) => {
      const result = persistedCardSchema.array().safeParse((persisted as Partial<CardState> | undefined)?.localCards);
      return result.success ? { ...current, localCards: result.data } : current;
    },
  })
);

export const replaceRemoteCards = (remoteCards: Card[]): void => {
  cardStore.setState({ remoteCards });
};

export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};

export const replaceLocalCards = (localCards: Card[]): void => {
  cardStore.setState({ localCards });
};
