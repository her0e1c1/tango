import { createStore } from "zustand/vanilla";
import type { PendingStudy } from "../api/pendingStudy";
import type { DeckId } from "@/entities/deck";

interface StudyCompletion {
  cardCount: number;
}

export interface StudySessionPageState {
  completion: StudyCompletion | undefined;
  showBackText: boolean;
  helpOpen: boolean;
  autoPlay: boolean;
  swipePending: boolean;
}

interface StudySessionPageStore {
  owner: { uid: string; deckId: DeckId } | undefined;
  pendingWork: Partial<Record<string, symbol>>;
  pendingOperation: PendingStudy | undefined;
  pendingReadFailed: boolean;
  pageState: StudySessionPageState;
}

export const studySessionPageStore = createStore<StudySessionPageStore>()(() => ({
  owner: undefined,
  // Saving outlives a visit. Resetting presentation must never release this lock.
  pendingWork: {},
  pendingOperation: undefined,
  pendingReadFailed: false,
  pageState: {
    completion: undefined,
    showBackText: false,
    helpOpen: false,
    autoPlay: false,
    swipePending: false,
  },
}));
