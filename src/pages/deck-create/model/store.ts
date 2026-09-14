import { createStore } from "zustand/vanilla";
import type { ToastId } from "@/shared/ui/toast";

interface DeckCreatePageState {
  session: symbol | undefined;
  pending: boolean;
  saveErrorToastId: ToastId | undefined;
}

export const deckCreatePageStore = createStore<DeckCreatePageState>()(() => ({
  session: undefined,
  pending: false,
  saveErrorToastId: undefined,
}));
