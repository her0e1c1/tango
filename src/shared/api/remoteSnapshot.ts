export type RemoteById<T> = Readonly<Record<string, T | undefined>>;

export const toRemoteById = <T>(items: readonly T[], keyOf: (item: T) => string): RemoteById<T> =>
  Object.fromEntries(items.map((item) => [keyOf(item), item]));

export type RemoteSyncStatus = "cached" | "pending" | "synced";

export interface RemoteSnapshotMetadata {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export interface RemoteChange<T> {
  added: T[];
  modified: T[];
  removed: string[];
}

export type RemoteSnapshot<T> =
  | { type: "replace"; items: T[]; metadata: RemoteSnapshotMetadata }
  | { type: "change"; event: RemoteChange<T>; metadata: RemoteSnapshotMetadata };

export interface RemoteSubscriptionProps<T> {
  uid: string;
  onSnapshot: (snapshot: RemoteSnapshot<T>) => void;
  onError: (error: Error) => void;
}
