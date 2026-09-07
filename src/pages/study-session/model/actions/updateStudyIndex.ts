import type { DeckId } from "@/entities/deck";
import { setStudySessionIndex } from "@/entities/study-session";
import { hideBackText } from "./hideBackText";

export function updateStudyIndex(deckId: DeckId, currentIndex: number): void {
  if (setStudySessionIndex(deckId, currentIndex)) hideBackText();
}
