import { useStore } from "zustand";

import { useSession } from "@/entities/session";
import type { RemoteStoreState } from "@/store/remoteStore";
import { remoteStore } from "@/store/remoteStore";

export const useRemoteRead = <T>(select: (state: RemoteStoreState) => T, empty: T) => {
  const auth = useSession();
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
