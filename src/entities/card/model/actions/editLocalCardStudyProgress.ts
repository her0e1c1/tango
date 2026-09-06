import { cardIdSchema, localCardSchema } from "../schema";
import type { LocalCard } from "../types";
import { cardStore } from "../store";

/** Learning fields embedded in a browser-persisted Card until local StudyProgress has its own store. */
type LocalCardStudyProgressEdit = Pick<LocalCard, "id"> &
  Partial<Pick<LocalCard, "difficulty" | "numberOfSeen" | "lastSeenAt" | "nextSeeingAt" | "interval">>;

// Persists local learning progress with the Card while keeping content edits behind their narrower schema.
export const editLocalCardStudyProgress = (input: LocalCardStudyProgressEdit): LocalCard => {
  const cardId = cardIdSchema.parse(input.id);
  const { localCards } = cardStore.getState();
  const currentCard = localCards.find(({ id }) => id === cardId);
  if (currentCard === undefined) throw new Error(`Local Card "${cardId}" was not found`);

  const updatedCard = localCardSchema.parse({ ...currentCard, ...input, updatedAt: Date.now() });
  const updatedLocalCards = localCards.map((card) => (card.id === cardId ? updatedCard : card));
  try {
    cardStore.setState({ localCards: updatedLocalCards });
  } catch (error) {
    // Zustand publishes before persisting; roll back only our still-live replacement so retries cannot compound it.
    const liveLocalCards = cardStore.getState().localCards;
    if (liveLocalCards.some((card) => card === updatedCard)) {
      try {
        cardStore.setState({
          localCards: liveLocalCards.map((card) => (card === updatedCard ? currentCard : card)),
        });
      } catch {
        // The rollback reaches memory before its persistence attempt, even while browser storage remains unavailable.
      }
    }
    throw error;
  }
  return updatedCard;
};
