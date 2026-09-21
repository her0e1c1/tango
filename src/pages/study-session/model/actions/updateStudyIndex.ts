import type { DeckId } from "@/entities/deck";
import { setStudySessionIndex } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { studySessionPageStore as store } from "../store";
import { hideBackText } from "./hideBackText";

export async function updateStudyIndex(deckId: DeckId, currentIndex: number): Promise<void> {
  const { owner, pendingWork } = store.getState();
  if (pendingWork || owner?.deckId !== deckId) return;
  const work = Symbol();
  store.setState({ pendingWork: work });
  try {
    if ((await setStudySessionIndex(deckId, currentIndex)) && store.getState().owner === owner) hideBackText();
  } catch {
    if (store.getState().owner === owner) showToast({ messageKey: "toast.saveFailure", tone: "error" });
  } finally {
    if (store.getState().pendingWork === work) store.setState({ pendingWork: undefined });
  }
}
