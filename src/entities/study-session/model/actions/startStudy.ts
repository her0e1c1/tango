import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";
import {
  buildStudyCardOrder,
  type CardProgressFields,
  type StudyCardOrderOptions,
} from "@/entities/study-progress/@x/study-session";

import { studySessionStore } from "../store";

const createStudySessionId = (): string => crypto.getRandomValues(new Uint32Array(4)).join("-");

// Replaces one Deck's study session with a new identity and owned Card order.
const startStudySession = (deckId: DeckId, cardOrderIds: CardId[]): void => {
  studySessionStore.setState((state) => {
    state.sessionsByDeckId[deckId] = {
      // A fresh identity distinguishes a restarted deck even when it begins on the same card and index.
      sessionId: createStudySessionId(),
      deckId,
      // The store owns this ordering snapshot even if the caller later reuses its array.
      cardOrderIds: [...cardOrderIds],
      currentIndex: 0,
      lastStudiedAt: Date.now(),
    };
  });
};

// Session start owns the state mutation while study-progress owns how the card order is derived.
export const startStudy = (
  deckId: DeckId,
  cards: CardProgressFields[],
  studyPreferences: StudyCardOrderOptions
): void => {
  startStudySession(deckId, buildStudyCardOrder(cards, studyPreferences));
};
