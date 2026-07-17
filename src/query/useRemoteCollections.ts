import { useQuery } from "@tanstack/react-query";
import { useMemo, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import { uniq } from "lodash";

import { useAuth } from "@/auth/AuthContext";
import { filterCardsForDeck } from "@/lib/study";
import { firestoreKeys } from "@/query/firestoreKeys";
import type { RemoteById } from "@/query/remoteCollection";
import type { RemoteReadState } from "@/query/remoteReadController";
import {
  getRemoteReadBlocker,
  getRemoteReadState,
  retryRemoteReads,
  subscribeRemoteReadBlocker,
  subscribeRemoteReadState,
} from "@/query/remoteReadSession";

const definedEntries = <T>(items: Record<string, T | undefined>) =>
  Object.entries(items).filter((entry): entry is [string, T] => entry[1] != null);

export const useRemoteCollections = () => {
  const authState = useAuth();
  const uid = authState.status === "authenticated" ? authState.uid : "";
  const reduxDeckState = useSelector((state: RootState) => state.deck);
  const reduxCardState = useSelector((state: RootState) => state.card);
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

  const collections = useMemo(() => {
    const reduxDecks = reduxDeckState.byId;
    const reduxCards = reduxCardState.byId;
    const localDeckEntries = definedEntries(reduxDecks).filter(([, deck]) => deck.localMode);
    const localDeckIds = new Set(localDeckEntries.map(([id]) => id));
    const localCardEntries = definedEntries(reduxCards).filter(([, card]) => localDeckIds.has(card.deckId));
    const decksById = {
      ...(hasActiveUid ? (remoteDeckQuery.data ?? {}) : {}),
      ...Object.fromEntries(localDeckEntries),
    };
    const cardsById = {
      ...(hasActiveUid ? (remoteCardQuery.data ?? {}) : {}),
      ...Object.fromEntries(localCardEntries),
    };
    const decks = definedEntries(decksById).map(([, deck]) => deck);
    const cards = definedEntries(cardsById).map(([, card]) => card);
    return { decksById, cardsById, decks, cards };
  }, [reduxDeckState, reduxCardState, remoteDeckQuery.data, remoteCardQuery.data, hasActiveUid]);

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
    ...collections,
    status,
    syncStatus,
    error,
    retry: retryRemoteReads,
    deckById: (id: string) => collections.decksById[id],
    cardById: (id: string) => collections.cardsById[id],
    cardsByDeckId: (deckId: string) => collections.cards.filter((card) => card.deckId === deckId),
    filteredCardsByDeckId: (deckId: string, config: ConfigState) => {
      const deck = collections.decksById[deckId];
      const cards = collections.cards.filter((card) => card.deckId === deckId);
      return deck == null ? [] : filterCardsForDeck(cards, deck, config);
    },
    tagsByDeckId: (deckId: string) =>
      uniq(collections.cards.filter((card) => card.deckId === deckId).flatMap((card) => card.tags)).sort(),
  };
};
