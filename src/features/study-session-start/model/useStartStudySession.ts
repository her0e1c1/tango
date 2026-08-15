import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { startStudySession } from "@/entities/study-session";
import { buildStudyCardOrder } from "@/entities/study-progress";

import * as React from "react";

interface UseStartStudySessionOptions {
  onStarted?: (() => void) | undefined;
}

export const useStartStudySession = (
  deckId: DeckId,
  { onStarted }: UseStartStudySessionOptions = {}
): ((cards: Card[]) => void) => {
  const preferences = usePreferences();
  return React.useCallback(
    (cards) => {
      startStudySession(deckId, buildStudyCardOrder(cards, preferences.study));
      onStarted?.();
    },
    [deckId, onStarted, preferences.study]
  );
};
