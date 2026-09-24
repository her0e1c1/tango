import { createStore } from "zustand/vanilla";
import type { DeckId } from "@/entities/deck";
import type { SwipeDirection } from "@/entities/preference";

interface StudyCompletion {
  cardCount: number;
}

interface StudySessionPageState {
  completion: StudyCompletion | undefined;
  showBackText: boolean;
  helpOpen: boolean;
  autoPlay: boolean;
}

interface PendingStudyResult {
  deckId: DeckId;
  sessionId: string;
  currentIndex: number;
  completed: boolean;
  cardCount: number;
  direction: SwipeDirection | undefined;
}

interface StudySessionPageStore {
  owner: { uid: string; deckId: DeckId } | undefined;
  isSaving: boolean;
  pendingResult: PendingStudyResult | undefined;
  pageState: StudySessionPageState;
}

export const studySessionPageStore = createStore<StudySessionPageStore>()(() => ({
  owner: undefined,
  // Saving outlives a visit. Resetting presentation must never release this lock.
  isSaving: false,
  pendingResult: undefined,
  pageState: {
    completion: undefined,
    showBackText: false,
    helpOpen: false,
    autoPlay: false,
  },
}));
