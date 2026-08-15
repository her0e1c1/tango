import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { StudyPreferences } from "@/entities/preferences";
import { compareStudyProgress, isStudyProgressEligible, type StudyCard } from "@/entities/study-progress";

const isCardMatchingTags = (card: Card, deck: Pick<Deck, "selectedTags" | "tagAndFilter">) => {
  const tags = deck.selectedTags;
  if (tags.length === 0) return true;
  if (deck.tagAndFilter) return tags.every((tag) => card.tags.includes(tag));
  return tags.some((tag) => card.tags.includes(tag));
};

export const filterCardsForDeck = <TCard extends Card>(
  cards: StudyCard<TCard>[],
  deck: Pick<Deck, "selectedTags" | "tagAndFilter" | "scoreMax" | "scoreMin">,
  study: Pick<StudyPreferences, "useCardInterval">,
  now: number
): StudyCard<TCard>[] => {
  const filtered = cards.filter(({ card, progress }) => {
    if (!isCardMatchingTags(card, deck)) return false;
    return isStudyProgressEligible(
      progress,
      {
        maximumScore: deck.scoreMax,
        minimumScore: deck.scoreMin,
        respectNextSeeingAt: study.useCardInterval,
      },
      now
    );
  });
  filtered.sort((first, second) => compareStudyProgress(first.progress, second.progress));
  return filtered;
};
