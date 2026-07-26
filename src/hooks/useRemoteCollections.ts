/**
 * @file Provides shared remote collection data and lookup behavior to React consumers.
 */

import { useEffect, useState } from "react";
import { useStore } from "zustand";

import { useAuth } from "@/auth/AuthContext";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { remoteValues, cardsForDeck, filteredCardsForDeck, tagsForDeck } from "@/store/remoteSelectors";
import { remoteStore } from "@/store/remoteStore";

const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Finds the next future review time so a screen can refresh exactly when a scheduled card becomes
 * available, without polling while nothing is due.
 */
export const nextCardAvailabilityAt = (cards: Card[], now: number): number | undefined => {
  let next: number | undefined;
  for (const card of cards) {
    const candidate = card.nextSeeingAt?.getTime();
    if (candidate === undefined || candidate <= now || (next !== undefined && candidate >= next)) continue;
    next = candidate;
  }
  return next;
};

/**
 * Provides the remote collections values and operations needed by React components.
 * Callers receive one focused interface without coordinating the remote-data layer's stores and
 * services themselves.
 */
export const useRemoteCollections = () => {
  const authState = useAuth();
  const uid = authState.status === "authenticated" ? authState.uid : "";
  const remoteState = useStore(remoteStore);
  const hasActiveUid = uid !== "" && remoteState.uid === uid;
  const decksById = hasActiveUid ? remoteState.decksById : {};
  const cardsById = hasActiveUid ? remoteState.cardsById : {};
  const decks = remoteValues(decksById);
  const cards = remoteValues(cardsById);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const current = Date.now();
    const next = nextCardAvailabilityAt(cards, current);
    if (next === undefined) return;

    const timeout = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(Math.max(next - current, 0), MAX_TIMEOUT_MS)
    );
    return () => window.clearTimeout(timeout);
  }, [cards, now]);

  const status = uid === "" ? "idle" : hasActiveUid ? remoteState.status : "loading";
  const error =
    hasActiveUid && (remoteState.status === "error" || remoteState.status === "blocked")
      ? remoteState.error
      : undefined;
  const syncStatus = hasActiveUid && remoteState.status === "ready" ? remoteState.syncStatus : undefined;

  return {
    decksById,
    cardsById,
    decks,
    cards,
    status,
    syncStatus,
    error,
    retry: remoteState.retry,
    deckById: (id: string) => decksById[id],
    cardById: (id: string) => cardsById[id],
    cardsByDeckId: (deckId: string) => cardsForDeck(cards, deckId),
    filteredCardsByDeckId: (deckId: string, config: ConfigState) =>
      filteredCardsForDeck(decksById, cards, deckId, config, now),
    tagsByDeckId: (deckId: string) => tagsForDeck(cards, deckId),
  };
};
