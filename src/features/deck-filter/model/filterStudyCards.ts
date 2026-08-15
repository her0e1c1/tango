import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import { createStudyProgressFromCard, isStudyProgressEligible } from "@/entities/study-progress";

type DeckFilter = Pick<Deck, "scoreMax" | "scoreMin" | "selectedTags" | "tagAndFilter">;
type StudyFilter = Pick<Preferences["study"], "useCardInterval">;

const isCardMatchingTags = (card: Card, deck: Pick<DeckFilter, "selectedTags" | "tagAndFilter">) => {
  const tags = deck.selectedTags;
  if (tags.length === 0) return true;
  if (deck.tagAndFilter) return tags.every((tag) => card.tags.includes(tag));
  return tags.some((tag) => card.tags.includes(tag));
};

export const filterStudyCards = <TCard extends Card>(
  cards: TCard[],
  deck: DeckFilter,
  study: StudyFilter,
  now: number
): TCard[] =>
  cards.filter((card) => {
    if (!isCardMatchingTags(card, deck)) return false;
    return isStudyProgressEligible(
      createStudyProgressFromCard(card),
      {
        maximumScore: deck.scoreMax,
        minimumScore: deck.scoreMin,
        respectNextSeeingAt: study.useCardInterval,
      },
      now
    );
  });
