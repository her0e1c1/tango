import type { DeckId } from "@/entities/deck/@x/study-session";

import { useStore } from "zustand";

import { studySessionStore } from "../store";
import type { StudySession } from "../types";

/** Keeps single-deck consumers isolated from updates to unrelated sessions. */
export const useStudySession = (deckId: DeckId): StudySession | undefined =>
  useStore(studySessionStore, (state) => state.sessionsByDeckId[deckId]);
