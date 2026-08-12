import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { StudyPreferences } from "@/shared/config";

export const filterCardsForDeck = (
  cards: Card[],
  deck: Pick<Deck, "selectedTags" | "tagAndFilter" | "scoreMax" | "scoreMin">,
  study: Pick<StudyPreferences, "useCardInterval">,
  now: number
): Card[] => {
  const filtered = cards.filter((card) => {
    const tags = deck.selectedTags;
    if (tags.length > 0) {
      if (deck.tagAndFilter && !tags.every((tag) => card.tags.includes(tag))) {
        return false;
      }
      if (!deck.tagAndFilter && !tags.some((tag) => card.tags.includes(tag))) {
        return false;
      }
    }
    if (deck.scoreMax != null && card.score > deck.scoreMax) {
      return false;
    }
    if (deck.scoreMin != null && card.score < deck.scoreMin) {
      return false;
    }
    if (study.useCardInterval && card.nextSeeingAt && card.nextSeeingAt.getTime() > now) {
      return false;
    }
    return true;
  });
  filtered.sort((first, second) => first.numberOfSeen - second.numberOfSeen);
  return filtered;
};
