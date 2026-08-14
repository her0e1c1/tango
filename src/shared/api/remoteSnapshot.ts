export type RemoteById<T extends { id: string }> = Readonly<Record<string, T | undefined>>;

export const toRemoteById = <T extends { id: string }>(items: readonly T[]): RemoteById<T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

export type RemoteSyncStatus = "cached" | "pending" | "synced";

interface RemoteSnapshot<T extends { id: string }> {
  itemsById: RemoteById<T>;
  syncStatus: RemoteSyncStatus;
}

export interface RemoteSubscriptionProps<T extends { id: string }> {
  uid: string;
  onSnapshot: (snapshot: RemoteSnapshot<T>) => void;
  onError: (error: Error) => void;
}
