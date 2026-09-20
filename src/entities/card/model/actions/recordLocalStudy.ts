import { assertSameStudyAttempt, studyAttemptSchema, type StudyAttempt } from "@/entities/study-progress/@x/card";
import { applyStudyRating, createStudyProgressFromCard } from "@/entities/study-progress/@x/card";
import { cardStore } from "../store";
import { localCardSchema } from "../schema";

export function recordLocalStudy(input: StudyAttempt): "committed" | "already-committed" {
  const attempt = studyAttemptSchema.parse(input);
  const previous = cardStore.getState();
  const existing = previous.studyAttempts.find(({ operationId }) => operationId === attempt.operationId);
  if (existing) {
    assertSameStudyAttempt(existing, attempt);
    return "already-committed";
  }
  const card = previous.localCards.find(({ id }) => id === attempt.cardId);
  if (!card || card.deckId !== attempt.deckId || card.deletedAt != null) throw new Error("Study target is unavailable");
  const { cardId: _, ...progress } = applyStudyRating(
    createStudyProgressFromCard(card),
    attempt.rating,
    attempt.answeredAt
  );
  const updated = localCardSchema.parse({ ...card, ...progress, updatedAt: Math.max(Date.now(), card.updatedAt) });
  try {
    cardStore.setState({
      localCards: previous.localCards.map((value) => (value.id === card.id ? updated : value)),
      studyAttempts: [...previous.studyAttempts, attempt],
    });
  } catch (error) {
    // A failed storage write must not leave an in-memory review that a retry could apply twice.
    try {
      cardStore.setState(previous);
    } catch {
      /* The rollback reaches memory before storage. */
    }
    throw error;
  }
  return "committed";
}
