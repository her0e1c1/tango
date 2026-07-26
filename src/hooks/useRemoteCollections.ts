/**
 * @file Provides shared remote collection data and lookup behavior to React consumers.
 */

import { useStore } from "zustand";

import { useAuth } from "@/auth/AuthContext";
import { remoteValues, cardsForDeck, filteredCardsForDeck, tagsForDeck } from "@/store/remoteSelectors";
import { remoteStore } from "@/store/remoteStore";

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
      filteredCardsForDeck(decksById, cards, deckId, config, Date.now()),
    tagsByDeckId: (deckId: string) => tagsForDeck(cards, deckId),
  };
};
