import { createStore } from "zustand/vanilla";
import type { DeckId } from "@/entities/deck";
import type { StudyCompletion } from "./types";

export interface StudySessionPageState {
  completion: StudyCompletion | undefined;
  showBackText: boolean;
  helpOpen: boolean;
  autoPlay: boolean;
  swipePending: boolean;
}

interface StudySessionPageStore {
  owner: { uid: string; deckId: DeckId } | undefined;
  pendingWork: symbol | undefined;
  pageState: StudySessionPageState;
}

export const studySessionPageStore = createStore<StudySessionPageStore>()(() => ({
  owner: undefined,
  // Saving outlives a visit. Resetting presentation must never release this lock.
  pendingWork: undefined,
  pageState: {
    completion: undefined,
    showBackText: false,
    helpOpen: false,
    autoPlay: false,
    swipePending: false,
  },
}));
