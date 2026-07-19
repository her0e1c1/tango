import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { uniq } from "lodash";

import { useAuth } from "@/auth/AuthContext";
import { filterCardsForDeck } from "@/lib/study";
import { firestoreKeys } from "@/query/cache/firestoreKeys";
import type { RemoteById } from "@/query/cache/remoteCollection";
import type { RemoteReadState } from "@/query/reads/syncState";
import {
  getRemoteReadBlocker,
  getRemoteReadState,
  retryRemoteReads,
  subscribeRemoteReadBlocker,
  subscribeRemoteReadState,
} from "@/query/reads/remoteReadSession";

const definedEntries = <T>(items: Record<string, T | undefined>) =>
  Object.entries(items).filter((entry): entry is [string, T] => entry[1] != null);

export const useRemoteCollections = () => {
  const authState = useAuth();
  const uid = authState.status === "authenticated" ? authState.uid : "";
  const remoteState = useSyncExternalStore(subscribeRemoteReadState, getRemoteReadState, getRemoteReadState);
  const blocker = useSyncExternalStore(subscribeRemoteReadBlocker, getRemoteReadBlocker, getRemoteReadBlocker);
  const hasActiveUid = uid !== "" && remoteState.uid === uid;
  const remoteDeckQuery = useQuery<RemoteById<Deck>>({
    queryKey: firestoreKeys.decks(uid),
    queryFn: async () => ({}),
    enabled: false,
  });
  const remoteCardQuery = useQuery<RemoteById<Card>>({
    queryKey: firestoreKeys.cards(uid),
    queryFn: async () => ({}),
    enabled: false,
  });

  const decksById = hasActiveUid ? (remoteDeckQuery.data ?? {}) : {};
  const cardsById = hasActiveUid ? (remoteCardQuery.data ?? {}) : {};
  const decks = definedEntries(decksById).map(([, deck]) => deck);
  const cards = definedEntries(cardsById).map(([, card]) => card);

  const status: RemoteReadState["status"] | "blocked" = blocker
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
    cardsByDeckId: (deckId: string) => cards.filter((card) => card.deckId === deckId),
    filteredCardsByDeckId: (deckId: string, config: ConfigState) => {
      const deck = decksById[deckId];
      const deckCards = cards.filter((card) => card.deckId === deckId);
      return deck == null ? [] : filterCardsForDeck(deckCards, deck, config, Date.now());
    },
    tagsByDeckId: (deckId: string) =>
      uniq(cards.filter((card) => card.deckId === deckId).flatMap((card) => card.tags)).sort(),
  };
};
