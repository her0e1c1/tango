import { createStore } from "zustand/vanilla";
import type { CardId } from "@/entities/card";

export const deckViewStore = createStore<{
  cardId: CardId | undefined;
  showBackText: boolean;
}>()(() => ({ cardId: undefined, showBackText: false }));
