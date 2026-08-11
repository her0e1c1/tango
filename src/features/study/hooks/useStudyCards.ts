import { useEffect, useState } from "react";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
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

export const useStudyCards = (deck: Deck | undefined, cards: Card[], config: ConfigState): Card[] => {
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());

  useEffect(() => {
    const current = Date.now();
    const refresh = window.setTimeout(() => setScheduleClock(current), 0);
    return () => window.clearTimeout(refresh);
  }, [cards]);

  useEffect(() => {
    const current = Date.now();
    const next = nextCardAvailabilityAt(cards, current);
    const availability =
      next === undefined
        ? undefined
        : window.setTimeout(() => setScheduleClock(Date.now()), Math.min(next - current, MAX_TIMEOUT_MS));
    return () => {
      if (availability !== undefined) window.clearTimeout(availability);
    };
  }, [cards, scheduleClock]);

  return deck == null ? [] : filterCardsForDeck(cards, deck, config.study, scheduleClock);
};
