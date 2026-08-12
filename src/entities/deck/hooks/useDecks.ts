import { useMemo } from "react";
import { useStore } from "zustand";

import type { Deck } from "@/entities/deck/model/deck";
import { deckRemoteReadStore } from "@/entities/deck/model/remoteReadStore";

export const useDecks = () => {
  const remote = useStore(deckRemoteReadStore);
  const decksById = remote.itemsById;
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
