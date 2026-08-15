import type { DeckId } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { buildStudyCardOrder, type StudyCard } from "@/entities/study-progress";
import { startStudySession } from "@/entities/study-session";

import { useCallback } from "react";

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
