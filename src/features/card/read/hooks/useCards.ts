import { cardRemoteReadStore } from "../model/remoteReadStore";
import { useRemoteRead } from "@/shared/lib/remote-read";

export const useCards = () => {
  const remote = useRemoteRead(cardRemoteReadStore);

  return {
    cardsById: remote.itemsById,
    cards: remote.items,
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};
