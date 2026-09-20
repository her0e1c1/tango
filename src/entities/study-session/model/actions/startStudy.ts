import type { DeckId } from "@/entities/deck/@x/study-session";
import {
  buildStudyCardOrder,
  type CardProgressFields,
  type StudyCardOrderOptions,
} from "@/entities/study-progress/@x/study-session";

import { studySessionStore } from "../store";

const createStudySessionId = (): string => crypto.getRandomValues(new Uint32Array(4)).join("-");

// Replaces one Deck's study session with a new identity and owned Card order.
export function startStudy(
  deckId: DeckId,
  cards: CardProgressFields[],
  studyPreferences: StudyCardOrderOptions,
  uid?: string
): void {
  const cardOrderIds = buildStudyCardOrder(cards, studyPreferences);
  studySessionStore.setState((state) => {
    state.sessionsByDeckId[deckId] = {
      // A fresh identity distinguishes a restarted deck even when it begins on the same card and index.
      sessionId: createStudySessionId(),
      deckId,
      // The store owns this ordering snapshot even if the caller later reuses its array.
      cardOrderIds: [...cardOrderIds],
      currentIndex: 0,
      lastStudiedAt: Date.now(),
      ...(uid ? { remote: { uid, startedAt: Date.now() } } : {}),
    };
  });
}
