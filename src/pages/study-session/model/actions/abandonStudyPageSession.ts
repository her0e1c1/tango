import { getAuthUid } from "@/entities/auth";
import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { abandonStudySession, getStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { clearSettledStudySession } from "./clearSettledStudySession";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";

export async function abandonStudyPageSession(deckId: string, direction?: SwipeDirection): Promise<void> {
  const uid = getAuthUid();
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== uid || owner.deckId !== deckId) return;
  const onLocalError = () => {
    if (studySessionPageStore.getState().owner === owner && getAuthUid() === uid)
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
  };
  const session = getStudySession(deckId);
  if (session === undefined) return;
  studySessionPageStore.setState({
    isSaving: true,
    savingSession: session,
    awaitingRollback: false,
    saveToken: undefined,
  });
  try {
    await abandonStudySession(deckId, onLocalError);
    studySessionPageStore.setState({ isSaving: false, savingSession: undefined });
    if (
      studySessionPageStore.getState().owner === owner &&
      getAuthUid() === uid &&
      direction !== undefined &&
      getPreferences().appearance.showSwipeFeedback
    )
      showSwipeFeedback(direction);
  } catch {
    studySessionPageStore.setState({ awaitingRollback: true });
    clearSettledStudySession();
    if (studySessionPageStore.getState().owner === owner && getAuthUid() === uid)
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
  }
}
