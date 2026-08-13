import { useMemo } from "react";
import { useStore } from "zustand";

import type { Deck } from "../model/deck";
import { deckRemoteReadStore } from "../model/remoteReadStore";
import type { RemoteById } from "@/shared/api";
import { useRemoteReadScopeUid } from "@/shared/lib/remote-read";

const EMPTY_DECKS: RemoteById<Deck> = {};

export const useDecks = () => {
  const uid = useRemoteReadScopeUid();
  const remote = useStore(deckRemoteReadStore);
  const hasActiveUid = uid !== null && remote.uid === uid;
  const decksById = hasActiveUid ? remote.itemsById : EMPTY_DECKS;
  const decks = useMemo(() => Object.values(decksById).filter((deck): deck is Deck => deck != null), [decksById]);

  return {
    decksById,
    decks,
    status: uid === null ? ("idle" as const) : hasActiveUid ? remote.status : ("loading" as const),
    syncStatus: hasActiveUid && remote.status === "ready" ? remote.syncStatus : undefined,
    error: hasActiveUid && (remote.status === "error" || remote.status === "blocked") ? remote.error : undefined,
    retry: remote.retry,
  };
};
