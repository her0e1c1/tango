import type { DeckId } from "@/entities/deck";
import { setStudySessionIndex } from "@/entities/study-session";
import { studySessionPageStore } from "../store";
import { hideBackText } from "./hideBackText";

export function updateStudyIndex(deckId: DeckId, currentIndex: number): void {
  if (studySessionPageStore.getState().pendingOperation || studySessionPageStore.getState().pendingReadFailed) return;
  if (setStudySessionIndex(deckId, currentIndex)) hideBackText();
}
