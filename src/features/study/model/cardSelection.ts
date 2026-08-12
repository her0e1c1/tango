import type { Deck } from "@/entities/deck";
import { compareStudyProgress, isStudyProgressEligible } from "@/entities/study-progress";
import type { StudyCard } from "@/features/study/model/studyCard";
import type { StudyPreferences } from "@/shared/config";

export const filterCardsForDeck = <TCard extends StudyCard["card"]>(
  cards: StudyCard<TCard>[],
  deck: Pick<Deck, "selectedTags" | "tagAndFilter" | "scoreMax" | "scoreMin">,
  study: Pick<StudyPreferences, "useCardInterval">,
  now: number
): StudyCard<TCard>[] => {
  const filtered = cards.filter(({ card, progress }) => {
    const tags = deck.selectedTags;
    if (tags.length > 0) {
      if (deck.tagAndFilter && !tags.every((tag) => card.tags.includes(tag))) {
        return false;
      }
      if (!deck.tagAndFilter && !tags.some((tag) => card.tags.includes(tag))) {
        return false;
      }
    }
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
