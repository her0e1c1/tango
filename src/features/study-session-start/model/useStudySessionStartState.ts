import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { type Card, useCardsByDeckId } from "@/entities/card";
import { type Deck, editDeck, isDeckTagSelectionMatching, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { isStudyProgressEligible, useStudyProgresses } from "@/entities/study-progress";
import { startStudy } from "@/entities/study-session";

type DeckFilterValues = Pick<Deck, "scoreMax" | "scoreMin" | "selectedTags" | "tagAndFilter">;
type StudyProgress = ReturnType<typeof useStudyProgresses>[number];

interface CardWithProgress {
  card: Card;
  progress: StudyProgress;
}

// Pairs each Card with its independently owned progress while omitting incomplete read snapshots.
const joinCardsWithProgress = (cards: Card[], progresses: StudyProgress[]): CardWithProgress[] => {
  const progressByCardId = new Map(progresses.map((progress) => [progress.cardId, progress]));
  return cards.flatMap((card) => {
    const progress = progressByCardId.get(card.id);
    return progress === undefined ? [] : [{ card, progress }];
  });
};

// Keeps multi-Entity selection in the use-case owner while each Entity supplies only its own pure rule.
const selectStudyCards = (
  cards: CardWithProgress[],
  deck: Deck,
  useCardInterval: boolean,
  now = Date.now()
): CardWithProgress[] =>
  cards.filter(
    ({ card, progress }) =>
      isDeckTagSelectionMatching(card.tags, deck) &&
      isStudyProgressEligible(
        progress,
        {
          maximumScore: deck.scoreMax,
          minimumScore: deck.scoreMin,
          respectNextSeeingAt: useCardInterval,
        },
        now
      )
  );

export const useStudySessionStartState = (deckId: string) => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const progresses = useStudyProgresses();
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const [filter, setFilter] = useState<DeckFilterValues>();

  if (deck == null) return;

  const cards = selectStudyCards(joinCardsWithProgress(deckCards, progresses), deck, preferences.study.useCardInterval);
  const storedFilter: DeckFilterValues = {
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
  };
  const updateFilter = <Key extends keyof DeckFilterValues>(key: Key, value: DeckFilterValues[Key]) => {
    setFilter((current) => ({ ...(current ?? storedFilter), [key]: value }));
    void editDeck(uid, { id: deck.id, [key]: value }).catch(() => undefined);
  };

  return {
    filter: {
      ...(filter ?? storedFilter),
      setScoreMax: (value: number | null) => updateFilter("scoreMax", value),
      setScoreMin: (value: number | null) => updateFilter("scoreMin", value),
      setSelectedTags: (value: string[]) => updateFilter("selectedTags", value),
      setTagAndFilter: (value: boolean) => updateFilter("tagAndFilter", value),
    },
    deckName: deck.name,
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    // Preserves the source count so presentation can distinguish an empty Deck from zero filter matches.
    rawCardsLength: deckCards.length,
    cardsLength: cards.length,
    tags,
    onStart: () =>
      startStudy(
        deck.id,
        cards.map(({ progress }) => progress),
        preferences.study
      ),
  };
};
