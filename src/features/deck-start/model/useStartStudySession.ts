import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { startStudySession } from "@/entities/study-session";

import { useCallback } from "react";

import { buildStudySession } from "./buildStudySession";

interface UseStartStudySessionOptions {
  onStarted?: (() => void) | undefined;
}

export const useStartStudySession = (
  deckId: DeckId,
  { onStarted }: UseStartStudySessionOptions = {}
): ((cards: Pick<Card, "id">[]) => void) => {
  const preferences = usePreferences();
  return useCallback(
    (cards) => {
      startStudySession(deckId, buildStudySession(cards, preferences.study));
      onStarted?.();
    },
    [deckId, onStarted, preferences.study]
  );
};
