import { useMemo } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import type { RemoteById, RemoteSyncStatus } from "@/shared/api";
import type { RemoteReadStoreState } from "./createRemoteReadStore";
import { useRemoteReadScope } from "./RemoteReadScope";

const EMPTY_ITEMS: RemoteById<never> = {};

export interface RemoteReadResult<T extends { id: string }> {
  items: T[];
  itemsById: RemoteById<T>;
  status: "idle" | "loading" | "ready" | "blocked" | "error";
  syncStatus?: RemoteSyncStatus | undefined;
  error?: Error | undefined;
  retry: () => void | Promise<void>;
}

export const useRemoteRead = <T extends { id: string }>(
  store: StoreApi<RemoteReadStoreState<T>>
): RemoteReadResult<T> => {
  const scope = useRemoteReadScope();
  const remote = useStore(store);
  const hasActiveUid = scope.uid !== null && remote.uid === scope.uid;
  const itemsById = hasActiveUid ? remote.itemsById : (EMPTY_ITEMS as RemoteById<T>);
  const items = useMemo(() => Object.values(itemsById).filter((item): item is T => item != null), [itemsById]);

  if (scope.uid === null) {
    return { items, itemsById, status: "idle", retry: remote.retry };
  }

  if (scope.lifecycle != null && scope.lifecycle.status !== "ready") {
    return {
      items,
      itemsById,
      status: scope.lifecycle.status,
      error:
        scope.lifecycle.status === "blocked" || scope.lifecycle.status === "error" ? scope.lifecycle.error : undefined,
      retry: scope.lifecycle.retry,
    };
  }

  if (!hasActiveUid) {
    return { items, itemsById, status: "loading", retry: remote.retry };
  }

  return {
    items,
    itemsById,
    status: remote.status,
    syncStatus: remote.status === "ready" ? remote.syncStatus : undefined,
    error: remote.status === "error" ? remote.error : undefined,
    retry: remote.retry,
  };
};
