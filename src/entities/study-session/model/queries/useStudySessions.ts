import { useStore } from "zustand";

import { studySessionStore } from "../store";
import type { StudySessions } from "../types";

/** Exposes the full map to consumers that compare or order progress across decks. */
export const useStudySessions = (): StudySessions => useStore(studySessionStore, (state) => state.sessionsByDeckId);
