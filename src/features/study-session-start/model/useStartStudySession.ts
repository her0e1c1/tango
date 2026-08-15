import type { DeckId } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import type { StudyCard } from "@/entities/study-progress";
import { startStudySession } from "@/entities/study-session";

import { useCallback } from "react";

import { buildStudyCardOrder } from "./buildStudyCardOrder";

interface UseStartStudySessionOptions {
  onStarted?: (() => void) | undefined;
}

export const useStartStudySession = (
  deckId: DeckId,
  { onStarted }: UseStartStudySessionOptions = {}
): ((cards: StudyCard[]) => void) => {
  const preferences = usePreferences();
  return useCallback(
    (cards) => {
      startStudySession(deckId, buildStudyCardOrder(cards, preferences.study));
      onStarted?.();
    },
    [deckId, onStarted, preferences.study]
  );
};
