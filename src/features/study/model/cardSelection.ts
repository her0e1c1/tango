import type { Deck } from "@/entities/deck";
import { compareStudyProgress, isStudyProgressEligible } from "@/entities/study-progress";
import type { StudyCard } from "./studyCard";
import type { StudyPreferences } from "@/entities/preferences";

const isCardMatchingTags = (card: StudyCard["card"], deck: Pick<Deck, "selectedTags" | "tagAndFilter">) => {
  const tags = deck.selectedTags;
  if (tags.length === 0) return true;
  if (deck.tagAndFilter) {
    return tags.every((tag) => card.tags.includes(tag));
  }
  return tags.some((tag) => card.tags.includes(tag));
};

export const filterCardsForDeck = <TCard extends StudyCard["card"]>(
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
