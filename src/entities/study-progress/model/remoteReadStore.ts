import { waitForFirestoreInitialization } from "@/shared/firestore";
import { createRemoteReadStore } from "@/shared/lib/remote-read";
import { subscribeStudyProgressReads, type StudyProgressRead } from "../api/subscribeStudyProgressReads";

export const studyProgressRemoteReadStore = createRemoteReadStore<StudyProgressRead>({
  waitForInitialization: waitForFirestoreInitialization,
  subscribe: subscribeStudyProgressReads,
  keyOf: (progress) => progress.cardId,
});

export const startStudyProgressReads = (uid: string) => studyProgressRemoteReadStore.getState().start(uid);
export const stopStudyProgressReads = (uid?: string) => studyProgressRemoteReadStore.getState().stop(uid);
