import { getAuthUid } from "@/entities/auth";
import { editStudyProgress } from "@/entities/study-progress";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export async function confirmBulkDifficulty(): Promise<void> {
  const { bulkCardIds: cardIds, bulkDifficulty: difficulty, mutationPending, owner } = cardListStore.getState();
  if (cardIds == null || difficulty == null || mutationPending || owner === undefined) return;
  // Lock both the targets and chosen value through partial failure and retries.
  cardListStore.setState({ mutationPending: true, bulkAttempted: true });
  try {
    // Capture the execution-time identity once so every write in this batch uses the same account.
    const uid = getAuthUid();
    // Absolute-value retries are idempotent. All writes must settle before another list operation can start.
    const results = await Promise.allSettled(cardIds.map((cardId) => editStudyProgress(uid, { cardId, difficulty })));
    if (cardListStore.getState().owner !== owner) return;
    const failureCount = results.filter(({ status }) => status === "rejected").length;
    if (failureCount === 0) {
      cardListStore.setState({ bulkCardIds: undefined, bulkDifficulty: null });
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
    // A previous visit must never release the current visit's mutation lock.
    if (cardListStore.getState().owner === owner) cardListStore.setState({ mutationPending: false });
  }
}
