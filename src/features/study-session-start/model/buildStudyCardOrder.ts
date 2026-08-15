import * as lodash from "lodash";

import type { StudyPreferences } from "@/entities/preferences";
import { compareStudyProgress, type StudyCard } from "@/entities/study-progress";

export const buildStudyCardOrder = (
  cards: StudyCard[],
  study: Pick<StudyPreferences, "shuffled" | "maxNumberOfCardsToLearn">
): string[] => {
  // Session start owns the complete order so filtered card consumers do not carry an implicit study-order contract.
  let cardOrderIds = [...cards]
    .sort((first, second) => compareStudyProgress(first.progress, second.progress))
    .map(({ card }) => card.id);
  if (study.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (study.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, study.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
