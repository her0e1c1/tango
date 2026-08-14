import * as lodash from "lodash";

import type { Card } from "@/entities/card";
import type { StudyPreferences, SwipeAction } from "@/entities/preferences";

export const calculateNextIndex = (currentIndex: number, cardCount: number, swipeAction: SwipeAction): number => {
  let nextIndex = currentIndex;
  if (swipeAction === "GoToPrevCard") {
    nextIndex -= 1;
  } else {
    nextIndex += 1;
  }
  if (nextIndex >= 0 && nextIndex < cardCount) {
    return nextIndex;
  }
  return -1;
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
