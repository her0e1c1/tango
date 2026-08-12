import { useMemo } from "react";
import { useStore } from "zustand";

import type { Card } from "@/entities/card/model/card";
import { cardRemoteReadStore } from "@/entities/card/model/remoteReadStore";

export const useCards = () => {
  const remote = useStore(cardRemoteReadStore);
  const cardsById = remote.itemsById;
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
