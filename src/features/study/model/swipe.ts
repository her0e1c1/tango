import type { Card, CardEdit } from "@/entities/card";
import type { SwipeAction, SwipeDirection, SwipeState } from "@/shared/config";

export const resolveSwipeAction = (controls: SwipeState, direction: SwipeDirection): SwipeAction => {
  return controls[direction];
};

export const calculateCardScore = (card: Pick<Card, "score">, swipeAction: SwipeAction): number => {
  if (swipeAction === "GoToNextCardMastered") {
    return card.score >= 0 ? card.score + 1 : 0;
  } else if (swipeAction === "GoToNextCardNotMastered" || swipeAction === "GoToNextCardToggleMastered") {
    return card.score <= 0 ? card.score - 1 : 0;
  }
  return card.score;
};

export const buildStudyPatch = (
  card: Pick<Card, "id" | "deckId" | "score" | "numberOfSeen">,
  swipeAction: SwipeAction,
  now: number
): CardEdit => {
  return {
    id: card.id,
    deckId: card.deckId,
    score: calculateCardScore(card, swipeAction),
    numberOfSeen: card.numberOfSeen + 1,
    lastSeenAt: now,
  };
};
