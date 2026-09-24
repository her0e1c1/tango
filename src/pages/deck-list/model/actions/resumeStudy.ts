import { getAuthUid } from "@/entities/auth";
import { touchStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";

export async function resumeStudy(deckId: string): Promise<boolean> {
  const uid = getAuthUid();
  try {
    touchStudySession(deckId);
    // Recheck identity after queued auth changes before allowing navigation.
    await Promise.resolve();
    return getAuthUid() === uid;
  } catch {
    if (getAuthUid() === uid) showToast({ messageKey: "studySession.syncFailure", tone: "error" });
    return false;
  }
}
