import type { DeckId } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { getStudySession } from "@/entities/study-session";
import { readPendingStudy, type PendingStudy } from "../../api/pendingStudy";
import { studySessionPageStore } from "../store";

export function enterStudySessionPage(uid: string, deckId: DeckId): () => void {
  const owner = { uid, deckId };
  const session = getStudySession(deckId);
  let pendingOperation: PendingStudy | undefined;
  let pendingReadFailed = false;
  try {
    if (session) pendingOperation = readPendingStudy(uid, session);
  } catch {
    pendingReadFailed = true;
  }
  studySessionPageStore.setState({
    owner,
    pendingOperation,
    pendingReadFailed,
    pageState: {
      ...studySessionPageStore.getInitialState().pageState,
      autoPlay: getPreferences().study.defaultAutoPlay,
      swipePending:
        session !== undefined && studySessionPageStore.getState().pendingWork[session.sessionId] !== undefined,
    },
  });
  return () => {
    if (studySessionPageStore.getState().owner !== owner) return;
    studySessionPageStore.setState({ owner: undefined });
  };
}
