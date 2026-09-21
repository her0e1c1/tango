import { getAuthUid } from "@/entities/auth";
import { setStudySessionIndex } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { studySessionPageStore as store } from "../store";
import { hideBackText } from "./hideBackText";

export async function updateStudyIndex(deckId: string, targetIndex: number): Promise<void> {
  const { owner, isSaving } = store.getState();
  if (owner?.deckId !== deckId || owner.uid !== getAuthUid() || isSaving) return;
  store.setState({ isSaving: true });
  try {
    if ((await setStudySessionIndex(deckId, targetIndex)) && store.getState().owner === owner) hideBackText();
  } catch {
    if (store.getState().owner === owner && getAuthUid() === owner.uid)
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
  } finally {
    store.setState({ isSaving: false });
  }
}
