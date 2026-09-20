import { studySessionStore } from "../store";
import type { StudySessionWrite } from "../types";

export function acknowledgeStudySessionWrite(write: StudySessionWrite): void {
  if (studySessionStore.getState().pendingWrites[write.session.sessionId] !== write) return;
  studySessionStore.setState((state) => {
    // A newer cursor or terminal write may have replaced this request while it was in flight.
    delete state.pendingWrites[write.session.sessionId];
  });
}
