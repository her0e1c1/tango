import { cardReplicaMetadataSchema, cardReplicaSchema, type CardReplicaMetadata } from "./document";
import type { RemoteCard } from "../model/types";

const REPLICA_DATABASE = "tango-card-replica";

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

export async function restoreCardReplica(
  uid: string
): Promise<{ metadata: CardReplicaMetadata; cards: RemoteCard[] } | null> {
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
      return null;
    return { metadata, cards };
  } catch {
    return null;
  }
}

export async function saveConfirmedCards(
  uid: string,
  cards: readonly RemoteCard[],
  lastUpdatedAt: number | null,
  { replace, signal }: { replace: boolean; signal: AbortSignal }
): Promise<void> {
  const database = await openCardReplica();
  try {
    if (signal.aborted) return;
    const transaction = database.transaction(["cards", "metadata"], "readwrite");
    const completed = completeReplicaTransaction(transaction);
    const metadataStore = transaction.objectStore("metadata");
    const request = metadataStore.get("replica");
    request.onsuccess = () => {
      const saved = cardReplicaMetadataSchema.safeParse(request.result);
      if ((!replace && (!saved.success || saved.data.uid !== uid)) || cards.some((card) => card.uid !== uid)) {
        transaction.abort();
        return;
      }
      const store = transaction.objectStore("cards");
      if (replace) store.clear();
      for (const card of cards) store.put(card);
      const count = store.count();
      count.onsuccess = () => metadataStore.put({ uid, lastUpdatedAt, version: 1, count: count.result }, "replica");
    };
    await completed;
  } finally {
    database.close();
  }
}
