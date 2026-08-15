import { useEffect, useState } from "react";
import { useStore } from "zustand";

import type { Card } from "@/entities/card/@x/deck";
import { getNextStudyAvailabilityAt } from "@/entities/study-progress/@x/deck";

import { selectStudyCardsForDeck } from "./rules";
import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

// Browsers clamp longer delays; capped timers reschedule until the actual availability time is reached.
const MAX_TIMEOUT_MS = 2_147_483_647;

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
): Card[] => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Refreshing at the next due time keeps the visible selection current while the page remains open.
    const next = getNextStudyAvailabilityAt(cards, now);
    if (next === undefined) return;

    const delay = Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT_MS);
    const availability = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(availability);
  }, [cards, now]);

  return selectStudyCardsForDeck(cards, deck, preferences.study, now);
};
