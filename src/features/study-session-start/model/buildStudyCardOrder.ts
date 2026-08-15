import * as lodash from "lodash";

import type { Card } from "@/entities/card";
import type { StudyPreferences } from "@/entities/preferences";

export const buildStudyCardOrder = (
  cards: Pick<Card, "id">[],
  study: Pick<StudyPreferences, "shuffled" | "maxNumberOfCardsToLearn">
): string[] => {
  let cardOrderIds = cards.map((card) => card.id);
  if (study.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (study.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, study.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
