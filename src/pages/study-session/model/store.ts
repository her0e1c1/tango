import { createStore } from "zustand/vanilla";
import type { DeckId } from "@/entities/deck";

interface StudyCompletion {
  cardCount: number;
}

interface StudySessionPageState {
  completion: StudyCompletion | undefined;
  showBackText: boolean;
  helpOpen: boolean;
  autoPlay: boolean;
}

interface StudySessionPageStore {
  owner: { uid: string; deckId: DeckId } | undefined;
  isSaving: boolean;
  pageState: StudySessionPageState;
}

export const studySessionPageStore = createStore<StudySessionPageStore>()(() => ({
  owner: undefined,
  // Saving outlives a visit. Resetting presentation must never release this lock.
  isSaving: false,
  pageState: {
    completion: undefined,
    showBackText: false,
    helpOpen: false,
    autoPlay: false,
  },
}));
