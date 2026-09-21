import { createStore } from "zustand/vanilla";
import type { Deck } from "./types";

export const deckStore = createStore<{ remoteDecks: Deck[] }>()(() => ({ remoteDecks: [] }));
