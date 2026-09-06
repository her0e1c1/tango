import type { DeckId } from "@/entities/deck";
import { setStudySessionIndex } from "@/entities/study-session";

export const updateStudyIndex = (deckId: DeckId, currentIndex: number, hideBackText: () => void): void => {
  if (setStudySessionIndex(deckId, currentIndex)) hideBackText();
};
