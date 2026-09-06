import { editStudyProgress } from "@/entities/study-progress";
import type { BulkDifficultyRequest, ListMutationControl } from "../types";
import { beginListMutation } from "./beginListMutation";
import { finishListMutation } from "./finishListMutation";

interface ConfirmBulkDifficultyOptions {
  uid: string;
  request: BulkDifficultyRequest | undefined;
  mutation: ListMutationControl;
  setRequest: (request: undefined) => void;
  setDifficulty: (difficulty: null) => void;
}

export const confirmBulkDifficulty = async ({
  uid,
  request,
  mutation,
  setRequest,
  setDifficulty,
}: ConfirmBulkDifficultyOptions) => {
  if (request == null || !beginListMutation(mutation)) return;
  try {
    // Absolute-value retries are idempotent. All writes must settle before another list operation can start.
    const results = await Promise.allSettled(
      request.cardIds.map((cardId) => editStudyProgress(uid, { cardId, difficulty: request.difficulty }))
    );
    if (!mutation.isMounted()) return;
    const failureCount = results.filter(({ status }) => status === "rejected").length;
    if (failureCount === 0) {
      setRequest(undefined);
      setDifficulty(null);
      return { outcome: "success" as const, cardCount: request.cardIds.length, difficulty: request.difficulty };
    }
    return {
      outcome: "partial-failure" as const,
      failureCount,
      successCount: request.cardIds.length - failureCount,
      totalCount: request.cardIds.length,
    };
  } finally {
    finishListMutation(mutation);
  }
};
