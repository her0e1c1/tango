import { useStore } from "zustand";

import { useRemoteReadScopeUid } from "@/shared/lib/remote-read";
import { deckRemoteReadStore } from "../model/remoteReadStore";

export const useDeckRead = () => {
  const uid = useRemoteReadScopeUid();
  const remote = useStore(deckRemoteReadStore);
  const hasActiveUid = uid !== null && remote.uid === uid;

  if (uid === null) return { status: "idle" as const, retry: remote.retry };
  if (!hasActiveUid) return { status: "loading" as const, retry: remote.retry };

  return {
    status: remote.status,
    syncStatus: remote.status === "ready" ? remote.syncStatus : undefined,
    error: remote.status === "error" ? remote.error : undefined,
    retry: remote.retry,
  };
};
