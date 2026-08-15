import type { DeckId } from "@/entities/deck/@x/study-session";

import { useStore } from "zustand";

import { studySessionStore } from "./store";
import type { StudySession, StudySessions } from "./types";

/** Keeps single-deck consumers isolated from updates to unrelated sessions. */
export const useStudySession = (deckId: DeckId): StudySession | undefined =>
  useStore(studySessionStore, (state) => state.sessionsByDeckId[deckId]);

/** Exposes the full map to consumers that compare or order progress across decks. */
export const useStudySessions = (): StudySessions => useStore(studySessionStore, (state) => state.sessionsByDeckId);
