import { createStore } from "zustand/vanilla";
import type { CardId } from "@/entities/card";

export const deckViewStore = createStore<{
  cardId: CardId | undefined;
  showBackText: boolean;
  autoPlay: boolean;
  helpOpen: boolean;
  positionRevision: number;
}>()(() => ({ cardId: undefined, showBackText: false, autoPlay: false, helpOpen: false, positionRevision: 0 }));
