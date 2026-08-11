import { useCallback, useMemo } from "react";

import type { RemoteById } from "@/domain/remoteSnapshot";
import type { Deck, DeckId } from "@/entities/deck/model/deck";
import { useRemoteRead } from "@/store/useRemoteRead";

const EMPTY_DECKS: RemoteById<Deck> = {};

export const useDecks = () => {
  const remote = useRemoteRead((state) => state.decksById, EMPTY_DECKS);
  const decksById = remote.data;
  const decks = useMemo(() => Object.values(decksById).filter((deck): deck is Deck => deck != null), [decksById]);
  const deckById = useCallback((id: DeckId) => decksById[id], [decksById]);

  return {
    decksById,
    decks,
    deckById,
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};

export const useDeck = (deckId: DeckId) => {
  const remote = useRemoteRead((state) => state.decksById, EMPTY_DECKS);

  return {
    deck: remote.data[deckId],
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};
