import { editStudyProgress, type recordCardStudyProgress } from "@/entities/study-progress";
import { moveStudySession, type StudySession } from "@/entities/study-session";
import type { SwipeDirection } from "@/entities/preference";
import { showToast } from "@/shared/ui/toast";
import { studySessionPageStore } from "../store";
import { getStudyUid } from "../queries/getStudyUid";
import { showStudyResult } from "./showStudyResult";

export async function saveLocalStudyProgress(
  uid: string,
  session: StudySession,
  progress: ReturnType<typeof recordCardStudyProgress>,
  direction: SwipeDirection | undefined
): Promise<void> {
  const { owner } = studySessionPageStore.getState();
  studySessionPageStore.setState({ isSaving: true });
  try {
    try {
      await editStudyProgress(uid, progress);
    } catch {
      if (studySessionPageStore.getState().owner === owner && getStudyUid() === uid)
        showToast({ messageKey: "studySession.answerSaveFailure", tone: "error" });
      return;
    }
    if (getStudyUid() !== uid || !moveStudySession(session)) return;
    if (studySessionPageStore.getState().owner !== owner) return;
    showStudyResult(session.currentIndex + 1 === session.cardOrderIds.length, session.cardOrderIds.length, direction);
  } finally {
    studySessionPageStore.setState({ isSaving: false });
  }
}
