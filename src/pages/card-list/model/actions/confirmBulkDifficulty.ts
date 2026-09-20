import { getAuthUid } from "@/entities/auth";
import { editStudyProgress } from "@/entities/study-progress";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export async function confirmBulkDifficulty(): Promise<void> {
  const { bulk, mutationId: pendingMutationId } = cardListStore.getState();
  if (bulk == null || bulk.difficulty == null || pendingMutationId !== undefined) return;
  const { cardIds, difficulty } = bulk;
  const mutationId = Symbol();
  // Lock both the targets and chosen value through partial failure and retries.
  cardListStore.setState({ mutationId, bulk: { ...bulk, attempted: true } });
  try {
    // Capture the execution-time identity once so every write in this batch uses the same account.
    const uid = getAuthUid();
    // Absolute-value retries are idempotent. All writes must settle before another list operation can start.
    const results = await Promise.allSettled(cardIds.map((cardId) => editStudyProgress(uid, { cardId, difficulty })));
    if (cardListStore.getState().mutationId !== mutationId) return;
    const failureCount = results.filter(({ status }) => status === "rejected").length;
    if (failureCount === 0) {
      cardListStore.setState({ bulk: undefined });
      showToast({
        messageKey: "cardList.bulkDifficulty.success",
        messageParams: { count: cardIds.length, difficulty },
        tone: "success",
      });
    } else {
      showToast({
        messageKey: "cardList.bulkDifficulty.partialFailure",
        messageParams: {
          count: failureCount,
          successCount: cardIds.length - failureCount,
          totalCount: cardIds.length,
        },
        tone: "error",
      });
    }
  } finally {
    // A reset detaches pending writes; their completion must not unlock a newer mutation.
    if (cardListStore.getState().mutationId === mutationId) {
      cardListStore.setState({ mutationId: undefined });
    }
  }
}
