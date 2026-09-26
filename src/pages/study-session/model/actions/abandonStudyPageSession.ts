import { getAuthUid } from "@/entities/auth";
import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { abandonStudySession, getStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";

export async function abandonStudyPageSession(deckId: string, direction?: SwipeDirection): Promise<boolean> {
  const uid = getAuthUid();
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== uid || owner.deckId !== deckId) return false;
  const session = getStudySession(deckId);
  if (session === undefined) return false;
  studySessionPageStore.setState({ isSaving: true });
  try {
    await abandonStudySession(deckId);
    if (
      studySessionPageStore.getState().owner === owner &&
      getAuthUid() === uid &&
      direction !== undefined &&
      getPreferences().appearance.showSwipeFeedback
    )
      showSwipeFeedback(direction);
    return studySessionPageStore.getState().owner === owner && getAuthUid() === uid;
  } catch {
    if (studySessionPageStore.getState().owner === owner && getAuthUid() === uid)
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
    return false;
  } finally {
    studySessionPageStore.setState({ isSaving: false });
  }
}
