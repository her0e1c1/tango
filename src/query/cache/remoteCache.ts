/**
 * @file Defines remote query cache behavior for Remote Cache.
 * The cache keeps Firestore data indexed by user and identifier so reads and optimistic mutations
 * share one source of truth.
 */

import type { QueryClient } from "@tanstack/react-query";

import { firestoreKeys } from "@/query/cache/firestoreKeys";
import type { RemoteById } from "@/query/cache/remoteCollection";

export interface RemoteCollectionTypes {
  decks: Deck;
  cards: Card;
}

export type RemoteCollectionName = keyof RemoteCollectionTypes;

export interface RemoteCache {
  read<Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection
  ): RemoteById<RemoteCollectionTypes[Collection]>;
  replace<Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection,
    next: RemoteById<RemoteCollectionTypes[Collection]>
  ): void;
}

const collectionKeys = {
  decks: firestoreKeys.decks,
  cards: firestoreKeys.cards,
};

/**
 * Creates and configures a remote cache.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createRemoteCache = (client: QueryClient): RemoteCache => {
  /**
   * Returns one user's cached remote collection, creating an empty collection on first access.
   * All readers receive the same identifier-indexed object until a replacement is published.
   */
  const read = <Collection extends RemoteCollectionName>(uid: string, collection: Collection) =>
    client.getQueryData<RemoteById<RemoteCollectionTypes[Collection]>>(collectionKeys[collection](uid)) ?? {};
  /**
   * Replaces one user's cached collection and notifies subscribers when its identity changes.
   * Writing the same object is ignored so React does not rerender for a no-op update.
   */
  const replace = <Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection,
    next: RemoteById<RemoteCollectionTypes[Collection]>
  ) => {
    client.setQueryData(collectionKeys[collection](uid), next);
  };
  return { read, replace };
};
