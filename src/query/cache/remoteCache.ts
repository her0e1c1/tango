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

export const createRemoteCache = (client: QueryClient): RemoteCache => {
  const read = <Collection extends RemoteCollectionName>(uid: string, collection: Collection) =>
    client.getQueryData<RemoteById<RemoteCollectionTypes[Collection]>>(collectionKeys[collection](uid)) ?? {};
  const replace = <Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection,
    next: RemoteById<RemoteCollectionTypes[Collection]>
  ) => {
    client.setQueryData(collectionKeys[collection](uid), next);
  };
  return { read, replace };
};
