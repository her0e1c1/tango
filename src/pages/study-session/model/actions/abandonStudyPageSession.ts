import { getAuthUid } from "@/entities/auth";
import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { abandonStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";

export async function abandonStudyPageSession(deckId: string, direction?: SwipeDirection): Promise<void> {
  const uid = getAuthUid();
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== uid || owner.deckId !== deckId) return;
  studySessionPageStore.setState({ isSaving: true });
  try {
    // Keep the interaction locked through this turn even though write acceptance is synchronous.
    abandonStudySession(deckId);
    await Promise.resolve();
    if (
      studySessionPageStore.getState().owner === owner &&
      getAuthUid() === uid &&
      direction !== undefined &&
      getPreferences().appearance.showSwipeFeedback
    )
      showSwipeFeedback(direction);
  } catch {
    if (studySessionPageStore.getState().owner === owner && getAuthUid() === uid)
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
  } finally {
    studySessionPageStore.setState({ isSaving: false });
  }
}
