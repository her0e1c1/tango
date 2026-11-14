import { getAuthUid } from "@/entities/auth";
import { touchStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { deckListStore } from "../store";

export async function resumeStudy(deckId: string): Promise<boolean> {
  const uid = getAuthUid();
  if (deckListStore.getState().pendingContinue?.uid === uid) return false;

  // Claim acceptance before awaiting so rapid activation cannot start a second Continue.
  const pendingContinue = { uid, deckId };
  deckListStore.setState({ pendingContinue });
  try {
    await touchStudySession(deckId);
    return getAuthUid() === uid && deckListStore.getState().pendingContinue === pendingContinue;
  } catch {
    if (getAuthUid() === uid && deckListStore.getState().pendingContinue === pendingContinue)
      showToast({ messageKey: "studySession.syncFailure", tone: "error" });
    return false;
  } finally {
    // An earlier account's result must not release a newer account's pending operation.
    if (deckListStore.getState().pendingContinue === pendingContinue)
      deckListStore.setState({ pendingContinue: undefined });
  }
}
