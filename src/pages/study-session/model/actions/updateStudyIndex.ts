import { getAuthUid } from "@/entities/auth";
import { getStudySession, setStudySessionIndex } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { studySessionPageStore as store } from "../store";
import { clearSettledStudySession } from "./clearSettledStudySession";
import { hideBackText } from "./hideBackText";

export async function updateStudyIndex(deckId: string, targetIndex: number): Promise<void> {
  const { owner, isSaving } = store.getState();
  if (owner?.deckId !== deckId || owner.uid !== getAuthUid() || isSaving) return;
  const onLocalError = () => {
    if (store.getState().owner === owner && getAuthUid() === owner.uid)
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
  };
  const session = getStudySession(deckId);
  if (session === undefined) return;
  store.setState({ isSaving: true, savingSession: session, awaitingRollback: false, saveToken: undefined });
  try {
    const accepted = await setStudySessionIndex(deckId, targetIndex, onLocalError);
    if (accepted && store.getState().owner === owner) hideBackText();
    store.setState({ isSaving: false, savingSession: undefined });
  } catch {
    store.setState({ awaitingRollback: true });
    clearSettledStudySession();
    if (store.getState().owner === owner && getAuthUid() === owner.uid)
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
  }
}
