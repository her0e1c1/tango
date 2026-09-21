import { setStudySessionIndex } from "@/entities/study-session";
import { studySessionPageStore } from "../store";
import { getStudyUid } from "../queries/getStudyUid";
import { hideBackText } from "./hideBackText";

export function updateStudyIndex(deckId: string, targetIndex: number): void {
  const { owner, pendingWork, pendingOperation } = studySessionPageStore.getState();
  if (
    owner?.deckId !== deckId ||
    owner.uid !== getStudyUid() ||
    pendingWork !== undefined ||
    pendingOperation !== undefined
  )
    return;
  if (setStudySessionIndex(deckId, targetIndex)) hideBackText();
}
