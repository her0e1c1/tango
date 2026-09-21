import * as lodash from "lodash";
import { classifyStudySchedule, type StudyScheduleFields } from "@/entities/study-schedule";

interface StudyOrderCard extends StudyScheduleFields {
  id: string;
  numberOfSeen: number;
}
interface StudyCardOrderOptions {
  useCardInterval?: boolean;
  shuffled: boolean;
  maxNumberOfCardsToLearn: number;
}

// Builds a least-seen-first Card order, optionally shuffling the full set before applying a positive session limit.
export const buildStudyCardOrder = (
  cards: StudyOrderCard[],
  options: StudyCardOrderOptions,
  now = Date.now()
): string[] => {
  if (options.useCardInterval) {
    const selected = cards
      .map((card) => ({ card, timing: classifyStudySchedule(card, now) }))
      .filter(({ timing }) => timing.status !== "future")
      .sort((a, b) => {
        if (a.timing.status === "new") return b.timing.status === "new" ? 0 : 1;
        if (b.timing.status === "new") return -1;
        return a.timing.dueAt - b.timing.dueAt;
      })
      .map(({ card }) => card.id);
    const limited = options.maxNumberOfCardsToLearn > 0 ? selected.slice(0, options.maxNumberOfCardsToLearn) : selected;
    return options.shuffled ? lodash.shuffle(limited) : limited;
  }
  let cardOrderIds = cards
    .slice()
    .sort((a, b) => a.numberOfSeen - b.numberOfSeen)
    .map((card) => card.id);
  // The maximum follows shuffling so a limited randomized session can draw from the complete card set.
  if (options.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (options.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, options.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
