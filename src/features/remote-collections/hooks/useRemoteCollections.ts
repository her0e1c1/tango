/**
 * @file Provides shared remote collection data and lookup behavior to React consumers.
 */
import type { Deck } from "@/entities/deck";
import type { Card } from "@/entities/card";

import { useEffect, useState } from "react";
import { useStore } from "zustand";

import { useAuth } from "@/shared/auth";
import type { RemoteById } from "@/shared/lib/remote";
import { remoteValues, cardsForDeck, tagsForDeck } from "../lib/remoteSelectors";
import { remoteStore } from "../model/remoteStore";

const MAX_TIMEOUT_MS = 2_147_483_647;
const EMPTY_DECKS: RemoteById<Deck> = {};
const EMPTY_CARDS: RemoteById<Card> = {};

/**
 * Finds the nearest future review time so scheduled cards can be refreshed without polling.
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
  const decksById = hasActiveUid ? remoteState.decksById : EMPTY_DECKS;
  const cardsById = hasActiveUid ? remoteState.cardsById : EMPTY_CARDS;
  const decks = remoteValues(decksById);
  const cards = remoteValues(cardsById);
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());

  useEffect(() => {
    const current = Date.now();
    const next = nextCardAvailabilityAt(remoteValues(cardsById), current);
    if (next === undefined) return;

    const timeout = window.setTimeout(() => setScheduleClock(Date.now()), Math.min(next - current, MAX_TIMEOUT_MS));
    return () => window.clearTimeout(timeout);
  }, [cardsById]);

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
    now: scheduleClock,
    syncStatus,
    error,
    retry: remoteState.retry,
    deckById: (id: string) => decksById[id],
    cardById: (id: string) => cardsById[id],
    cardsByDeckId: (deckId: string) => cardsForDeck(cards, deckId),
    tagsByDeckId: (deckId: string) => tagsForDeck(cards, deckId),
  };
};
