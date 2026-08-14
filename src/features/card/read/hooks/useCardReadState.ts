import { cardRemoteReadStore } from "../model/remoteReadStore";
import { useRemoteRead } from "@/shared/lib/remote-read";

export const useCardReadState = () => {
  const remote = useRemoteRead(cardRemoteReadStore);

  return {
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};
