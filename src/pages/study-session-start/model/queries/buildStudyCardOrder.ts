import * as lodash from "lodash";
import { classifyFsrsState, type FsrsState } from "@/entities/card-study-state";

interface StudyOrderCard {
  id: string;
  fsrs: FsrsState | null;
}
interface StudyCardOrderOptions {
  useCardInterval?: boolean;
  shuffled: boolean;
  maxNumberOfCardsToLearn: number;
}

// Orders due cards before unrated cards; without intervals, preserves the source order.
export const buildStudyCardOrder = (
  cards: StudyOrderCard[],
  options: StudyCardOrderOptions,
  now = Date.now()
): string[] => {
  if (options.useCardInterval) {
    const selected = cards
      .map((card) => ({ card, timing: classifyFsrsState(card.fsrs, now) }))
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
  let cardOrderIds = cards.map((card) => card.id);
  // The maximum follows shuffling so a limited randomized session can draw from the complete card set.
  if (options.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (options.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, options.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
