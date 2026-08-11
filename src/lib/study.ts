/**
 * @file Defines shared application rules for Study.
 * The module keeps framework-independent calculations and contracts separate from components and
 * remote services.
 */

import * as lodash from "lodash";

/**
 * Resolves the swipe action value from config for a given direction.
 */
export const resolveSwipeAction = (controls: SwipeState, direction: SwipeDirection): cardSwipe => {
  return controls[direction];
};

/**
 * Calculates the new card score based on the swipe action.
 */
export const calculateCardScore = (card: Pick<Card, "score">, swipeAction: cardSwipe): number => {
  if (swipeAction === "GoToNextCardMastered") {
    return card.score >= 0 ? card.score + 1 : 0;
  } else if (swipeAction === "GoToNextCardNotMastered" || swipeAction === "GoToNextCardToggleMastered") {
    return card.score <= 0 ? card.score - 1 : 0;
  }
  return card.score;
};

/**
 * Builds the card update patch for a study swipe event.
 */
export const buildStudyPatch = (
  card: Pick<Card, "id" | "deckId" | "score" | "numberOfSeen">,
  swipeAction: cardSwipe,
  now: number
): CardEdit => {
  return {
    id: card.id,
    deckId: card.deckId,
    score: calculateCardScore(card, swipeAction),
    numberOfSeen: card.numberOfSeen + 1,
    lastSeenAt: now,
  };
};

/**
 * Calculates the next card index after a swipe.
 * Returns -1 when the study session is finished (index out of bounds).
 */
export const calculateNextIndex = (currentIndex: number, cardCount: number, swipeAction: cardSwipe): number => {
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

/**
 * Builds the ordered list of card IDs for a study session, applying shuffle
 * and max-card-limit from config.
 */
export const buildStudySession = (
  cards: Pick<Card, "id">[],
  study: Pick<StudyPreferences, "shuffled" | "maxNumberOfCardsToLearn">
): string[] => {
  let cardOrderIds = cards.map((c) => c.id);
  if (study.shuffled) {
    cardOrderIds = lodash.shuffle(cardOrderIds);
  }
  if (study.maxNumberOfCardsToLearn > 0) {
    cardOrderIds = cardOrderIds.slice(0, study.maxNumberOfCardsToLearn);
  }
  return cardOrderIds;
};

/**
 * Filters and sorts cards for a study session based on deck settings and config.
 */
export const filterCardsForDeck = (
  cards: Card[],
  deck: Pick<Deck, "selectedTags" | "tagAndFilter" | "scoreMax" | "scoreMin">,
  study: Pick<StudyPreferences, "useCardInterval">,
  now: number
): Card[] => {
  const filtered = cards.filter((c) => {
    const tags = deck.selectedTags;
    if (tags.length > 0) {
      if (deck.tagAndFilter && !tags.every((t) => c.tags.includes(t))) {
        return false;
      }
      if (!deck.tagAndFilter && !tags.some((t) => c.tags.includes(t))) {
        return false;
      }
    }
    if (deck.scoreMax != null && c.score > deck.scoreMax) {
      return false;
    }
    if (deck.scoreMin != null && c.score < deck.scoreMin) {
      return false;
    }
    if (study.useCardInterval && c.nextSeeingAt && c.nextSeeingAt.getTime() > now) {
      return false;
    }
    return true;
  });
  filtered.sort((c1, c2) => c1.numberOfSeen - c2.numberOfSeen);
  return filtered;
};
