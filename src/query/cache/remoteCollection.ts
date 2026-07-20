/**
 * @file Defines remote query cache behavior for Remote Collection.
 * The cache keeps Firestore data indexed by user and identifier so reads and optimistic mutations
 * share one source of truth.
 */

export type RemoteById<T> = Record<string, T | undefined>;

/**
 * Indexes a list of remote entities by each entity's identifier.
 * The normalized object supports fast lookup and targeted optimistic updates without repeatedly
 * scanning an array.
 */
export const toRemoteById = <T extends { id: string }>(items: T[]): RemoteById<T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));
