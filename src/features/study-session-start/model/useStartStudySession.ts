import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { startStudySession } from "@/entities/study-session";
import { buildStudyCardOrder } from "@/entities/study-progress";

interface UseStartStudySessionOptions {
  onStarted?: (() => void) | undefined;
}

export const useStartStudySession = (deckId: DeckId, { onStarted }: UseStartStudySessionOptions = {}) => {
  const { study } = usePreferences();
  return (cards: Card[]) => {
    startStudySession(deckId, buildStudyCardOrder(cards, study));
    onStarted?.();
  };
};
