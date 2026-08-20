import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { useCardsByDeckId } from "@/entities/card";
import { type Deck, editDeck, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { selectStudyCards, startStudy } from "@/entities/study-session";

type DeckFilterValues = Pick<Deck, "scoreMax" | "scoreMin" | "selectedTags" | "tagAndFilter">;

export const useStudySessionStartState = (deckId: string) => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const [filter, setFilter] = useState<DeckFilterValues>();

  if (deck == null) return;

  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);
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
    onStart: () => startStudy(deck.id, cards, preferences.study),
  };
};
