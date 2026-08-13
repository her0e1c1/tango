import type { DeckId } from "@/entities/deck/@x/study-progress";
import type { StudyProgressEdit } from "../model/studyProgress";

import { cardMutationLock, deckMembershipMutationLock, withDeckMembershipLocks } from "@/store/remoteMutationLocks";
import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";
import { update as updateRemoteStudyProgress } from "./firestore";

export const studyProgressCommands = {
  update: async (uid: string, deckId: DeckId, progress: StudyProgressEdit): Promise<void> => {
    if (uid === "") throw new Error("A confirmed user is required for remote StudyProgress writes");
    await runSerially(cardMutationLock(uid, progress.cardId), () =>
      withDeckMembershipLocks([deckMembershipMutationLock(uid, deckId)], "shared", () =>
        waitForRemoteWrite(updateRemoteStudyProgress(progress), "StudyProgress update")
      )
    );
  },
};
