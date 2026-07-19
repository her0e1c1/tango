export interface RemoteSnapshotMetadata {
  size: number;
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
