import type { CardId, CardCreateCommand, CardEditInput } from "../model/types";
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

import { restoreCardReplica, saveConfirmedCards } from "./replica";

const CARD_COLLECTION = "card";

interface CardSubscription {
  uid: string;
  signal: AbortSignal;
  replace: boolean;
  lastUpdatedAt: number | null;
  changes: Map<string, { document: QueryDocumentSnapshot; confirmed: boolean }>;
  onReady: (() => void) | undefined;
}

async function receiveCardSnapshot(state: CardSubscription, snapshot: QuerySnapshot): Promise<void> {
  if (state.signal.aborted) return;
  for (const change of snapshot.docChanges({ includeMetadataChanges: true })) {
    const previous = state.changes.get(change.doc.id);
    // Keep an unapplied confirmed value through later local or query-window events.
    if (
      previous?.confirmed &&
      (snapshot.metadata.fromCache || change.type === "removed" || change.doc.metadata.hasPendingWrites)
    )
      continue;
    // Leaving the query window is not a domain deletion, including after a rejected write.
    if (change.type === "removed" || change.doc.metadata.hasPendingWrites) state.changes.delete(change.doc.id);
    else state.changes.set(change.doc.id, { document: change.doc, confirmed: !snapshot.metadata.fromCache });
  }
  if (snapshot.metadata.fromCache) return;
  // A metadata-only server event can confirm cached candidates without new document changes.
  for (const change of state.changes.values()) change.confirmed = true;
  const documents = [...state.changes.values()].map(({ document: item }) => ({
    id: item.id,
    document: parseCardDocument(item.id, item.data()),
  }));
  const cards = documents.map(({ id, document }) => mapCardDocument(id, document));
  const checkpoint = snapshot.metadata.hasPendingWrites
    ? state.lastUpdatedAt
    : documents.reduce(
        (latest, { document }) => Math.max(latest ?? 0, document.updatedAt.toDate().getTime()),
        state.lastUpdatedAt
      );
  await saveConfirmedCards(state.uid, cards, checkpoint, { replace: state.replace, signal: state.signal });
  state.signal.throwIfAborted();
  applyCardChanges(cards);
  state.lastUpdatedAt = checkpoint;
  state.replace = false;
  state.changes.clear();
  state.onReady?.();
}

// Anonymous data lives exclusively in the SDK cache, including pending writes.
function subscribeLocalCards(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  let active = true;
  clearRemoteCards();
  const report = (error: unknown) => {
    if (active) onError(error instanceof Error ? error : new Error(String(error)));
  };
  const stop = onSnapshot(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!active) return;
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
    active = false;
    stop();
  };
}

// Include tombstones; the Store exposes only active documents.
export function subscribeCards(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  if (auth.currentUser?.isAnonymous) return subscribeLocalCards(uid, onError, onReady);
  const controller = new AbortController();
  const { signal } = controller;
  clearRemoteCards();
  let stop: (() => void) | undefined;
  const report = (error: unknown) => {
    if (!signal.aborted) onError(error instanceof Error ? error : new Error(String(error)));
  };
  async function start() {
    const restored = await restoreCardReplica(uid);
    if (signal.aborted) return;
    if (restored) {
      applyCardChanges(restored.cards);
      onReady?.();
    }
    const lastUpdatedAt = restored?.metadata.lastUpdatedAt ?? null;
    const constraints = [where("uid", "==", uid)];
    if (lastUpdatedAt !== null) constraints.push(where("updatedAt", ">=", Timestamp.fromMillis(lastUpdatedAt)));
    const state: CardSubscription = {
      uid,
      signal,
      replace: restored === null,
      lastUpdatedAt,
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
    controller.abort();
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
