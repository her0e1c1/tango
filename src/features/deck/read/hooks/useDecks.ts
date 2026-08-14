import type { Deck } from "@/entities/deck";

import { useRemoteRead } from "@/shared/lib/remote-read";
import { deckRemoteReadStore } from "../model/remoteReadStore";

export const useDecks = () => {
  const remote = useRemoteRead<Deck>(deckRemoteReadStore);

  return {
    decksById: remote.itemsById,
    decks: remote.items,
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};
