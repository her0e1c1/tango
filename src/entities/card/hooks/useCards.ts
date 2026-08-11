import { useMemo } from "react";

import type { RemoteById } from "@/domain/remoteSnapshot";
import type { Card } from "@/entities/card/model/card";
import { useRemoteRead } from "@/store/useRemoteRead";

const EMPTY_CARDS: RemoteById<Card> = {};

export const useCards = () => {
  const remote = useRemoteRead((state) => state.cardsById, EMPTY_CARDS);
  const cardsById = remote.data;
  const cards = useMemo(() => Object.values(cardsById).filter((card): card is Card => card != null), [cardsById]);

  return {
    cardsById,
    cards,
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};
