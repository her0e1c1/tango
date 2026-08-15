import * as lodash from "lodash";

import type { Card } from "@/entities/card";
import type { StudyPreferences, SwipeAction } from "@/entities/preferences";

export type StudyTransition =
  | { type: "no-op" }
  | { type: "move"; index: number }
  | { type: "complete" }
  | { type: "exit" };

const forwardActions = new Set<SwipeAction>([
  "GoToNextCard",
  "GoToNextCardMastered",
  "GoToNextCardNotMastered",
  "GoToNextCardToggleMastered",
]);

export const resolveStudyTransition = (
  currentIndex: number,
  cardCount: number,
  swipeAction: SwipeAction
): StudyTransition => {
  if (swipeAction === "DoNothing") return { type: "no-op" };
  if (swipeAction === "GoBack") return { type: "exit" };
  if (swipeAction === "GoToPrevCard") {
    return currentIndex > 0 ? { type: "move", index: currentIndex - 1 } : { type: "no-op" };
  }
  if (!forwardActions.has(swipeAction) || currentIndex < 0 || currentIndex >= cardCount) {
    return { type: "no-op" };
  }
  return currentIndex === cardCount - 1 ? { type: "complete" } : { type: "move", index: currentIndex + 1 };
};

export const buildStudySession = (
  cards: Pick<Card, "id">[],
  study: Pick<StudyPreferences, "shuffled" | "maxNumberOfCardsToLearn">
): string[] => {
  let cardOrderIds = cards.map((card) => card.id);
  if (study.shuffled) {
    cardOrderIds = lodash.shuffle(cardOrderIds);
  }
  if (study.maxNumberOfCardsToLearn > 0) {
    cardOrderIds = cardOrderIds.slice(0, study.maxNumberOfCardsToLearn);
  }
  return cardOrderIds;
};
