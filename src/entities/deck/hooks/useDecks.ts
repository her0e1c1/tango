import { useMemo } from "react";

import type { RemoteById } from "@/domain/remoteSnapshot";
import type { Deck } from "@/entities/deck/model/deck";
import { useRemoteRead } from "@/store/useRemoteRead";

const EMPTY_DECKS: RemoteById<Deck> = {};

export const useDecks = () => {
  const remote = useRemoteRead((state) => state.decksById, EMPTY_DECKS);
  const decksById = remote.data;
  const decks = useMemo(() => Object.values(decksById).filter((deck): deck is Deck => deck != null), [decksById]);

  return {
    decksById,
    decks,
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};
