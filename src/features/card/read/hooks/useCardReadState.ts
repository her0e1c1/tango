import { useStore } from "zustand";

import { useRemoteReadScopeUid } from "@/shared/lib/remote-read";
import { cardReadLifecycleStore } from "../model/readLifecycleStore";

export const useCardReadState = () => {
  const scopeUid = useRemoteReadScopeUid();
  const lifecycle = useStore(cardReadLifecycleStore);

  if (scopeUid === null) return { status: "idle" as const, retry: lifecycle.retry };
  if (lifecycle.uid !== scopeUid) return { status: "loading" as const, retry: lifecycle.retry };

  return {
    status: lifecycle.status,
    syncStatus: lifecycle.status === "ready" ? lifecycle.syncStatus : undefined,
    error: lifecycle.status === "error" ? lifecycle.error : undefined,
    retry: lifecycle.retry,
  };
};
