import { useMemo } from "react";
import { useStore } from "zustand";

import type { Card } from "@/entities/card/model/card";
import { cardRemoteReadStore } from "@/entities/card/model/remoteReadStore";
import type { RemoteById } from "@/shared/api/remoteSnapshot";
import { useRemoteReadScopeUid } from "@/shared/lib/remote-read/RemoteReadScope";

const EMPTY_CARDS: RemoteById<Card> = {};

export const useCards = () => {
  const uid = useRemoteReadScopeUid();
  const remote = useStore(cardRemoteReadStore);
  const hasActiveUid = uid !== null && remote.uid === uid;
  const cardsById = hasActiveUid ? remote.itemsById : EMPTY_CARDS;
  const cards = useMemo(() => Object.values(cardsById).filter((card): card is Card => card != null), [cardsById]);

  return {
    cardsById,
    cards,
    status: uid === null ? ("idle" as const) : hasActiveUid ? remote.status : ("loading" as const),
    syncStatus: hasActiveUid && remote.status === "ready" ? remote.syncStatus : undefined,
    error: hasActiveUid && (remote.status === "error" || remote.status === "blocked") ? remote.error : undefined,
    retry: remote.retry,
  };
};
