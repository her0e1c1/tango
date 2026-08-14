type RemoteById<T extends { id: string }> = Readonly<Record<string, T | undefined>>;

export const toRemoteById = <T extends { id: string }>(items: readonly T[]): RemoteById<T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

export type RemoteSyncStatus = "cached" | "pending" | "synced";
