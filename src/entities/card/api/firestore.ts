import type { CardId, CardCreateCommand, CardEditInput, CardMutation, FsrsState } from "../model/types";
import { FirebaseError } from "firebase/app";
import {
  getDocFromCache,
  onSnapshot,
  collection,
  doc,
  serverTimestamp,
  query,
  setDoc,
  updateDoc,
  where,
  type WriteBatch,
} from "firebase/firestore";
import { auth, db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { mapCardDocument, parseCardDocument } from "./document";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { applyCardSnapshot, findCardById } from "../model/store";
import { fsrsStateSchema, instantSchema } from "../model/fsrs";

const CARD_COLLECTION = "card";

// Include tombstones; the Store exposes only active documents.
export function subscribeCards(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  return onSnapshot(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      try {
        const values = snapshot.docs.map((item) => {
          return mapCardDocument(item.id, parseCardDocument(item.id, item.data({ serverTimestamps: "estimate" })));
        });
        applyCardSnapshot(values);
        onReady?.();
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    onError
  );
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

export function writeCardFsrs(
  batch: WriteBatch,
  input: {
    uid: string;
    cardId: string;
    deckId: string;
    fsrs: FsrsState;
    answeredAt: number;
  }
) {
  const card = findCardById(input.cardId);
  instantSchema.parse(input.answeredAt);
  if (!(input.uid && card) || card.uid !== input.uid || card.deckId !== input.deckId || card.deletedAt !== null)
    throw new Error("Study Card does not match");
  batch.update(doc(db, "card", input.cardId), {
    fsrs: fsrsStateSchema.parse(input.fsrs),
    updatedAt: serverTimestamp(),
  });
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
