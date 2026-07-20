/**
 * @file Provides shared remote-data behavior for Use Remote Collections.
 * Feature hooks use this layer to read and update Firestore data without owning cache or
 * subscription details.
 */

import { useSyncExternalStore } from "react";

import { useAuth } from "@/auth/AuthContext";
import {
  getRemoteReadBlocker,
  getRemoteReadState,
  retryRemoteReads,
  subscribeRemoteReadBlocker,
  subscribeRemoteReadState,
} from "@/query/reads/remoteReadSession";
import { cardsForDeck, filteredCardsForDeck, remoteValues, tagsForDeck } from "@/query/selectors";
import type { RemoteState } from "@/store/remoteStore";

/**
 * Provides the remote collections values and operations needed by React components.
 * Callers receive one focused interface without coordinating the remote-data layer's stores and
 * services themselves.
 */
export const useRemoteCollections = () => {
  const authState = useAuth();
  const uid = authState.status === "authenticated" ? authState.uid : "";
  const remoteState = useSyncExternalStore(subscribeRemoteReadState, getRemoteReadState, getRemoteReadState);
  const blocker = useSyncExternalStore(subscribeRemoteReadBlocker, getRemoteReadBlocker, getRemoteReadBlocker);
  const hasActiveUid = uid !== "" && remoteState.uid === uid;
  const decksById = hasActiveUid ? remoteState.decksById : {};
  const cardsById = hasActiveUid ? remoteState.cardsById : {};
  const decks = remoteValues(decksById);
  const cards = remoteValues(cardsById);

  const status: RemoteState["status"] | "blocked" = blocker
    ? "blocked"
    : uid === ""
      ? "idle"
      : hasActiveUid
        ? remoteState.status
        : "loading";
  const error = blocker ?? (hasActiveUid && remoteState.status === "error" ? remoteState.error : undefined);
  const syncStatus = hasActiveUid && remoteState.status === "ready" ? remoteState.syncStatus : undefined;

  return {
    decksById,
    cardsById,
    decks,
    cards,
    status,
    syncStatus,
    error,
    retry: retryRemoteReads,
    deckById: (id: string) => decksById[id],
    cardById: (id: string) => cardsById[id],
    cardsByDeckId: (deckId: string) => cardsForDeck(cards, deckId),
    filteredCardsByDeckId: (deckId: string, config: ConfigState) =>
      filteredCardsForDeck(decksById, cards, deckId, config, Date.now()),
    tagsByDeckId: (deckId: string) => tagsForDeck(cards, deckId),
  };
};
