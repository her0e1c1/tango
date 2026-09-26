import type {
  CardCreate,
  CardCreateInput,
  CardEdit,
  DeleteCardInput,
  EditCardInput,
  CardId,
  CardCreateCommand,
  CardEditInput,
  CardMutation,
} from "../model/types";
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
import { db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { mapCardDocument, parseCardDocument } from "./document";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { applyCardSnapshot } from "../model/store";
import { fsrsStateSchema, instantSchema, type FsrsState } from "../model/fsrs";
import { findCardById } from "../model/store";

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

/** Prepared imports retry the same IDs; a locally saved Card must never be initialized again. */
const createCardDocument = async (card: CardCreate): Promise<void> => {
  const reference = doc(db, CARD_COLLECTION, card.id);
  const existing = await getDocFromCache(reference).catch((error: unknown) => {
    if (error instanceof FirebaseError && error.code === "unavailable") return;
    throw error;
  });
  if (existing?.exists()) {
    const saved = parseCardDocument(card.id, existing.data({ serverTimestamps: "estimate" }));
    if (saved.uid !== card.uid || saved.deckId !== card.deckId) throw new Error("Card identity does not match");
    return;
  }
  const createdAt = Date.now();
  const document = omitUndefined({ ...card, fsrs: null, createdAt, updatedAt: serverTimestamp() });
  void setDoc(reference, document).catch(() => undefined);
};

/** Validates Card ownership before creating its Firestore document. */
const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
  const input = createCardSchema.parse({ uid, card });
  await createCardDocument(input.card);
};

/** Writes the editable Card fields and advances the update timestamp. */
const updateCardDocument = (card: CardEdit): Promise<void> => {
  const document = omitUndefined({
    frontText: card.frontText,
    backText: card.backText,
    tags: card.tags,
    uniqueKey: card.uniqueKey,
    updatedAt: serverTimestamp(),
  });
  const reference = doc(db, CARD_COLLECTION, card.id);
  void updateDoc(reference, document).catch(() => undefined);
  return Promise.resolve();
};

/** Validates Card ownership before editing its Firestore document. */
const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};

/** Tombstones a Card so synchronized readers can converge before hiding it. */
const removeCardDocument = (id: string): Promise<void> => {
  const deletedAt = Date.now();
  const reference = doc(db, CARD_COLLECTION, id);
  void updateDoc(reference, { updatedAt: serverTimestamp(), deletedAt }).catch(() => undefined);
  return Promise.resolve();
};

/** Validates Card ownership before tombstoning its Firestore document. */
const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const input = deleteCardSchema.parse({ uid, card });
  await removeCardDocument(input.card.id);
};

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

export async function createOwnedCard(uid: string, card: CardCreateCommand): Promise<void> {
  await createCard(uid, { ...card, uid });
}

export async function editOwnedCard(uid: string, card: CardEditInput): Promise<void> {
  requireOwnedCard(uid, card.id);
  await editCard(uid, { ...card, uid });
}

export async function mutateCards(uid: string, mutations: CardMutation[]): Promise<void> {
  const results = await Promise.allSettled(
    mutations.map((mutation) =>
      mutation.kind === "create" ? createOwnedCard(uid, mutation.card) : editOwnedCard(uid, mutation.card)
    )
  );
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}

export async function deleteOwnedCard(uid: string, id: CardId): Promise<void> {
  requireOwnedCard(uid, id);
  await deleteCard(uid, { id, uid });
}
