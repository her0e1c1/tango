import { type DeckId, deckMembershipMutationLock, withDeckMembershipLocks } from "@/entities/deck/@x/study-progress";
import type { StudyProgressEdit } from "../model/studyProgress";

import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";
import { update as updateRemoteStudyProgress } from "./firestore";

const studyProgressMutationLock = (uid: string, cardId: string) => `card:${uid}:${cardId}`;

export const studyProgressCommands = {
  update: async (uid: string, deckId: DeckId, progress: StudyProgressEdit): Promise<void> => {
    if (uid === "") throw new Error("A confirmed user is required for remote StudyProgress writes");
    await runSerially(studyProgressMutationLock(uid, progress.cardId), () =>
      withDeckMembershipLocks([deckMembershipMutationLock(uid, deckId)], "shared", () =>
        waitForRemoteWrite(updateRemoteStudyProgress(progress), "StudyProgress update")
      )
    );
  },
};
