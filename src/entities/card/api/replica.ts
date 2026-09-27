import { cardReplicaMetadataSchema, cardReplicaSchema, type CardReplicaMetadata } from "./document";
import { applyCardChanges, clearRemoteCards } from "../model/store";
import type { RemoteCard } from "../model/types";

const REPLICA_DATABASE = "tango-card-replica";
export const cardReplicaSession = { generation: 0, restoredGeneration: 0 };

function openCardReplica(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REPLICA_DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("cards", { keyPath: "id" });
      request.result.createObjectStore("metadata");
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error ?? new Error("Card replica could not be opened"));
  });
}

function completeReplicaTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Card replica transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("Card replica transaction failed"));
  });
}

async function readCardReplica() {
  const database = await openCardReplica();
  try {
    const transaction = database.transaction(["cards", "metadata"], "readonly");
    const metadata = transaction.objectStore("metadata").get("replica");
    const cards = transaction.objectStore("cards").getAll();
    await completeReplicaTransaction(transaction);
    return { metadata: metadata.result as unknown, cards: cards.result as unknown[] };
  } finally {
    database.close();
  }
}

async function resetCardReplica(uid: string, generation: number): Promise<void> {
  const database = await openCardReplica();
  try {
    if (generation !== cardReplicaSession.generation) return;
    const transaction = database.transaction(["cards", "metadata"], "readwrite");
    transaction.objectStore("cards").clear();
    transaction.objectStore("metadata").put({ uid, lastUpdatedAt: null, version: 1, count: 0 }, "replica");
    await completeReplicaTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function restoreCardReplica(uid: string): Promise<CardReplicaMetadata> {
  cardReplicaSession.generation += 1;
  const generation = cardReplicaSession.generation;
  clearRemoteCards();
  try {
    const saved = await readCardReplica();
    const metadata = cardReplicaMetadataSchema.parse(saved.metadata);
    const cards = saved.cards.map((card) => cardReplicaSchema.parse(card));
    const checkpointMatches =
      metadata.lastUpdatedAt === null || cards.some((card) => card.updatedAt >= (metadata.lastUpdatedAt ?? 0));
    if (
      metadata.uid !== uid ||
      metadata.count !== cards.length ||
      cards.some((card) => card.uid !== uid) ||
      !checkpointMatches
    )
      throw new Error("Card replica ownership or completeness does not match");
    if (generation === cardReplicaSession.generation) {
      applyCardChanges(cards);
      cardReplicaSession.restoredGeneration = generation;
    }
    return metadata;
  } catch {
    // Missing, incompatible or corrupt replicas must never leave a usable checkpoint behind.
    if (generation === cardReplicaSession.generation) await resetCardReplica(uid, generation).catch(() => undefined);
    return { uid, lastUpdatedAt: null, version: 1 };
  }
}

export async function saveConfirmedCards(
  uid: string,
  cards: readonly RemoteCard[],
  lastUpdatedAt: number | null
): Promise<void> {
  const database = await openCardReplica();
  try {
    const transaction = database.transaction(["cards", "metadata"], "readwrite");
    const completed = completeReplicaTransaction(transaction);
    const metadataStore = transaction.objectStore("metadata");
    const request = metadataStore.get("replica");
    request.onsuccess = () => {
      const saved = cardReplicaMetadataSchema.safeParse(request.result);
      if (!saved.success || saved.data.uid !== uid || cards.some((card) => card.uid !== uid)) {
        transaction.abort();
        return;
      }
      const store = transaction.objectStore("cards");
      for (const card of cards) store.put(card);
      const count = store.count();
      count.onsuccess = () => metadataStore.put({ uid, lastUpdatedAt, version: 1, count: count.result }, "replica");
    };
    await completed;
  } finally {
    database.close();
  }
}
