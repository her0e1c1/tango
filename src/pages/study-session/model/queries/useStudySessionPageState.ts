import { useState } from "react";
import { useStore } from "zustand";
import type { DeckId } from "@/entities/deck";
import { useStudySession } from "@/entities/study-session";
import { usePreferences } from "@/entities/preference";
import { studySessionPageStore, type StudySessionPageState } from "../store";

export function useStudySessionPageState(uid: string, deckId: DeckId): StudySessionPageState {
  // A new mount can render before the old visit's cleanup. Never expose that visit's completion,
  // even when its UID and Deck match; entering the Page will install a fresh owner identity.
  const [previousOwner] = useState(() => studySessionPageStore.getState().owner);
  const session = useStudySession(deckId);
  const state = useStore(studySessionPageStore);
  const preferences = usePreferences();
  if (state.owner !== previousOwner && state.owner?.uid === uid && state.owner.deckId === deckId) {
    // A rejected final write restores the session through the SDK snapshot. Expose that Card for retry.
    return session && state.pageState.completion ? { ...state.pageState, completion: undefined } : state.pageState;
  }
  return {
    ...studySessionPageStore.getInitialState().pageState,
    autoPlay: preferences.study.defaultAutoPlay,
  };
}
