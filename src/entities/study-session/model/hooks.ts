import type { DeckId } from "@/entities/deck/@x/study-session";

import { useStore } from "zustand";

import { studySessionStore } from "./store";
import type { StudySession, StudySessions } from "./types";

export const useStudySession = (deckId: DeckId): StudySession | undefined =>
  useStore(studySessionStore, (state) => state.sessionsByDeckId[deckId]);

export const useStudySessions = (): StudySessions => useStore(studySessionStore, (state) => state.sessionsByDeckId);
