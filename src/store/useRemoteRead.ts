import { useStore } from "zustand";

import { useAuth } from "@/auth/AuthContext";
import type { RemoteStoreState } from "@/store/remoteStore";
import { remoteStore } from "@/store/remoteStore";

export const useRemoteRead = <T>(select: (state: RemoteStoreState) => T, empty: T) => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const remoteState = useStore(remoteStore);
  const hasActiveUid = uid !== "" && remoteState.uid === uid;

  return {
    data: hasActiveUid ? select(remoteState) : empty,
    status: uid === "" ? ("idle" as const) : hasActiveUid ? remoteState.status : ("loading" as const),
    syncStatus: hasActiveUid && remoteState.status === "ready" ? remoteState.syncStatus : undefined,
    error:
      hasActiveUid && (remoteState.status === "error" || remoteState.status === "blocked")
        ? remoteState.error
        : undefined,
    retry: remoteState.retry,
  };
};
