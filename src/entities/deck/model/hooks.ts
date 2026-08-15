import { useStore } from "zustand";

import type { Card } from "@/entities/card/@x/deck";
import { useTimeDependentValue } from "@/shared/lib/useTimeDependentValue";

import { selectStudyCardsForDeck } from "./rules";
import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

export const useDecks = (): Deck[] => {
  const state = useStore(deckStore);
  return [...state.remoteDecks, ...state.localDecks];
};

export const useDeck = (id: DeckId | undefined): Deck | undefined =>
  useStore(
    deckStore,
    (state) => state.remoteDecks.find((deck) => deck.id === id) ?? state.localDecks.find((deck) => deck.id === id)
  );

export const useFilteredStudyCards = (
  deck: Deck | undefined,
  cards: Card[],
  preferences: { study: { useCardInterval: boolean } }
): Card[] =>
  useTimeDependentValue((now) => {
    const selection = selectStudyCardsForDeck(cards, deck, preferences.study, now);
    return { value: selection.cards, nextUpdateAt: selection.nextAvailabilityAt };
  });
