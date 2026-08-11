import { useEffect, useState } from "react";

import { type Card, useCardsByDeck } from "@/entities/card";
import { type DeckId, useDeck } from "@/entities/deck";
import { filterCardsForDeck } from "@/lib/study";
import type { ConfigState } from "@/shared/config";

const MAX_TIMEOUT_MS = 2_147_483_647;

export const nextCardAvailabilityAt = (cards: Card[], now: number): number | undefined => {
  let next: number | undefined;
  for (const card of cards) {
    const candidate = card.nextSeeingAt?.getTime();
    if (candidate === undefined || candidate <= now || (next !== undefined && candidate >= next)) continue;
    next = candidate;
  }
  return next;
};

export const useStudyCards = (deckId: DeckId, config: ConfigState) => {
  const deckRemote = useDeck(deckId);
  const cardRemote = useCardsByDeck(deckId);
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());

  useEffect(() => {
    const current = Date.now();
    const refresh = window.setTimeout(() => setScheduleClock(current), 0);
    const next = nextCardAvailabilityAt(cardRemote.cards, current);
    const availability =
      next === undefined
        ? undefined
        : window.setTimeout(() => setScheduleClock(Date.now()), Math.min(next - current, MAX_TIMEOUT_MS));
    return () => {
      window.clearTimeout(refresh);
      if (availability !== undefined) window.clearTimeout(availability);
    };
  }, [cardRemote.cards]);

  return {
    cards:
      deckRemote.deck == null ? [] : filterCardsForDeck(cardRemote.cards, deckRemote.deck, config.study, scheduleClock),
    status: cardRemote.status,
    syncStatus: cardRemote.syncStatus,
    error: cardRemote.error,
    retry: cardRemote.retry,
  };
};
