import { studySessionStore } from "../store";

export function finishStudySessionLoading(): void {
  studySessionStore.setState({ remoteLoading: false });
}
