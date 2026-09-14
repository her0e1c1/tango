import { editStudyProgress } from "@/entities/study-progress";
import { showToast } from "@/shared/ui/toast";
import type { CardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export async function confirmBulkDifficulty(store: CardListStore, uid: string): Promise<void> {
  const { bulkCardIds: cardIds, bulkDifficulty: difficulty, mutationPending } = store.getState();
  if (cardIds == null || difficulty == null || mutationPending) return;
  dismissListError(store);
  // Lock both the targets and chosen value through partial failure and retries.
  store.setState({ mutationPending: true, bulkAttempted: true });
  try {
    // Absolute-value retries are idempotent. All writes must settle before another list operation can start.
    const results = await Promise.allSettled(cardIds.map((cardId) => editStudyProgress(uid, { cardId, difficulty })));
    if (!store.getState().active) return;
    const failureCount = results.filter(({ status }) => status === "rejected").length;
    if (failureCount === 0) {
      store.setState({ bulkCardIds: undefined, bulkDifficulty: null });
      showToast({
        messageKey: "cardList.bulkDifficulty.success",
        messageParams: { count: cardIds.length, difficulty },
        tone: "success",
      });
    } else {
      store.setState({
        errorToastId: showToast({
          messageKey: "cardList.bulkDifficulty.partialFailure",
          messageParams: {
            count: failureCount,
            successCount: cardIds.length - failureCount,
            totalCount: cardIds.length,
          },
          tone: "error",
        }),
      });
    }
  } finally {
    store.setState({ mutationPending: false });
  }
}
