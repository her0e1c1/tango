import type { DeckId } from "@/entities/deck/@x/study-session";

import { studySessionStore } from "../store";
import type { StudySession } from "../types";

// Reads the active study session for one Deck outside React.
export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];
