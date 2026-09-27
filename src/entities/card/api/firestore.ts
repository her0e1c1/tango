import type { CardId, CardCreateCommand, CardEditInput, CardMutation } from "../model/types";
import { FirebaseError } from "firebase/app";
import {
  getDocFromCache,
  Timestamp,
  type QuerySnapshot,
  type QueryDocumentSnapshot,
  onSnapshot,
  collection,
  doc,
  serverTimestamp,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { mapCardDocument, parseCardDocument } from "./document";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { applyCardChanges, applyCardSnapshot, clearRemoteCards, findCardById } from "../model/store";

import { cardReplicaSession, restoreCardReplica, saveConfirmedCards } from "./replica";

const CARD_COLLECTION = "card";

interface CardSubscription {
  uid: string;
  generation: number;
  lastUpdatedAt: number | null;
  maximumSeen: number | null;
  changes: Map<string, QueryDocumentSnapshot>;
  onReady: (() => void) | undefined;
}

async function receiveCardSnapshot(state: CardSubscription, snapshot: QuerySnapshot): Promise<void> {
  if (state.generation !== cardReplicaSession.generation) return;
  for (const change of snapshot.docChanges({ includeMetadataChanges: true })) {
    // Leaving the query window is not a domain deletion, including after a rejected write.
    if (change.type === "removed" || change.doc.metadata.hasPendingWrites) state.changes.delete(change.doc.id);
    else state.changes.set(change.doc.id, change.doc);
  }
  if (snapshot.metadata.fromCache) return;
  const documents = [...state.changes.values()].map((item) => ({
    id: item.id,
    document: parseCardDocument(item.id, item.data()),
  }));
  const cards = documents.map(({ id, document }) => mapCardDocument(id, document));
  for (const { document } of documents) {
    // Legacy numeric timestamps are imported on full sync, never used as server checkpoints.
    if (typeof document.updatedAt !== "number")
      state.maximumSeen = Math.max(state.maximumSeen ?? 0, document.updatedAt.toDate().getTime());
  }
  const checkpoint = snapshot.metadata.hasPendingWrites ? state.lastUpdatedAt : state.maximumSeen;
  await saveConfirmedCards(state.uid, cards, checkpoint);
  if (state.generation !== cardReplicaSession.generation) return;
  applyCardChanges(cards);
  state.lastUpdatedAt = checkpoint;
  state.changes.clear();
  state.onReady?.();
}

// Anonymous data lives exclusively in the SDK cache, including pending writes.
function subscribeLocalCards(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  cardReplicaSession.generation += 1;
  const generation = cardReplicaSession.generation;
  clearRemoteCards();
  const report = (error: unknown) => {
    if (generation === cardReplicaSession.generation)
      onError(error instanceof Error ? error : new Error(String(error)));
  };
  const stop = onSnapshot(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (generation !== cardReplicaSession.generation) return;
      try {
        const cards = snapshot.docs.map((item) =>
          mapCardDocument(item.id, parseCardDocument(item.id, item.data({ serverTimestamps: "estimate" })))
        );
        applyCardSnapshot(cards);
        onReady?.();
      } catch (error) {
        report(error);
      }
    },
    report
  );
  return () => {
    if (generation === cardReplicaSession.generation) cardReplicaSession.generation += 1;
    stop();
  };
}

// Include tombstones; the Store exposes only active documents.
export function subscribeCards(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  if (auth.currentUser?.isAnonymous) return subscribeLocalCards(uid, onError, onReady);
  const restored = restoreCardReplica(uid);
  const generation = cardReplicaSession.generation;
  let stop: (() => void) | undefined;
  const report = (error: unknown) => {
    if (generation === cardReplicaSession.generation)
      onError(error instanceof Error ? error : new Error(String(error)));
  };
  async function start() {
    const metadata = await restored;
    if (generation !== cardReplicaSession.generation) return;
    if (generation === cardReplicaSession.restoredGeneration) onReady?.();
    const constraints = [where("uid", "==", uid)];
    if (metadata.lastUpdatedAt !== null)
      constraints.push(where("updatedAt", ">=", Timestamp.fromMillis(metadata.lastUpdatedAt)));
    const state: CardSubscription = {
      uid,
      generation,
      lastUpdatedAt: metadata.lastUpdatedAt,
      maximumSeen: metadata.lastUpdatedAt,
      changes: new Map(),
      onReady,
    };
    let queue = Promise.resolve();
    stop = onSnapshot(
      query(collection(db, CARD_COLLECTION), ...constraints),
      { includeMetadataChanges: true },
      (snapshot) => {
        queue = queue.then(() => receiveCardSnapshot(state, snapshot)).catch(report);
      },
      report
    );
  }
  void start().catch(report);
  return () => {
    if (generation === cardReplicaSession.generation) cardReplicaSession.generation += 1;
    stop?.();
  };
}

export async function createCard(uid: string, card: CardCreateCommand): Promise<void> {
  const input = createCardSchema.parse({ uid, card: { ...card, uid } });
  const reference = doc(db, CARD_COLLECTION, input.card.id);
  // Prepared imports retry the same IDs; a locally saved Card must never be initialized again.
  const existing = await getDocFromCache(reference).catch((error: unknown) => {
    if (error instanceof FirebaseError && error.code === "unavailable") return;
    throw error;
  });
  if (existing?.exists()) {
    const saved = parseCardDocument(input.card.id, existing.data({ serverTimestamps: "estimate" }));
    if (saved.uid !== input.card.uid || saved.deckId !== input.card.deckId)
      throw new Error("Card identity does not match");
    return;
  }
  const createdAt = Date.now();
  const document = omitUndefined({ ...input.card, fsrs: null, createdAt, updatedAt: serverTimestamp() });
  const write = setDoc(reference, document);
  if (auth.currentUser?.isAnonymous) void write.catch(globalThis.reportError);
  else await write;
}

export async function editCard(uid: string, card: CardEditInput): Promise<void> {
  requireOwnedCard(uid, card.id);
  const input = editCardSchema.parse({ uid, card: { ...card, uid } });
  const document = omitUndefined({
    frontText: input.card.frontText,
    backText: input.card.backText,
    tags: input.card.tags,
    uniqueKey: input.card.uniqueKey,
    fsrs: input.card.fsrs,
    updatedAt: serverTimestamp(),
  });
  const reference = doc(db, CARD_COLLECTION, input.card.id);
  const write = updateDoc(reference, document);
  if (auth.currentUser?.isAnonymous) void write.catch(globalThis.reportError);
  else await write;
}

export async function deleteCard(uid: string, id: CardId): Promise<void> {
  requireOwnedCard(uid, id);
  const input = deleteCardSchema.parse({ uid, card: { id, uid } });
  const deletedAt = Date.now();
  const reference = doc(db, CARD_COLLECTION, input.card.id);
  const write = updateDoc(reference, { updatedAt: serverTimestamp(), deletedAt });
  if (auth.currentUser?.isAnonymous) void write.catch(globalThis.reportError);
  else await write;
}

function requireOwnedCard(uid: string, id: CardId) {
  const card = findCardById(id);
  if (card === undefined) throw new Error(`Card "${id}" was not found`);
  if (!uid || card.uid !== uid) throw new Error("Card owner does not match the authenticated user");
  return card;
}

export async function mutateCards(uid: string, mutations: CardMutation[]): Promise<void> {
  const results = await Promise.allSettled(
    mutations.map((mutation) =>
      mutation.kind === "create" ? createCard(uid, mutation.card) : editCard(uid, mutation.card)
    )
  );
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}
