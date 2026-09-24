import type {
  CardCreate,
  CardCreateInput,
  CardEdit,
  DeleteCardInput,
  EditCardInput,
  RemoteCard,
  CardId,
  CardCreateCommand,
  CardEditInput,
  CardMutation,
} from "../model/types";
import { FirebaseError } from "firebase/app";
import {
  getDocFromCache,
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type WriteBatch,
  getDocsFromCache,
} from "firebase/firestore";
import { db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { mapCardDocument, parseCardDocument } from "./document";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { replaceRemoteCards } from "../model/actions/replaceRemoteCards";
import { fsrsStateSchema, instantSchema, type FsrsState } from "../model/fsrs";
import { findCardById } from "../model/queries/findCardById";
import { findDeckById } from "@/entities/deck/@x/card";

const CARD_COLLECTION = "card";

// Do not filter `deletedAt == null` in the Firestore query.
// A remote tombstone would otherwise leave the query as a removed change backed by the previous matching document,
// so this client would not receive the updated tombstone itself. Hide tombstones only when publishing the active store.
export const subscribeCards = (uid: string, onError: (error: Error) => void, onReady?: () => void): (() => void) =>
  onSnapshot(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        replaceRemoteCards(
          snapshot.docs
            .map((document) => mapCardDocument(document.id, parseCardDocument(document.id, document.data())))
            .filter((card) => card.deletedAt === null)
        );
        onReady?.();
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

/** Prepared imports retry the same IDs; a locally saved Card must never be initialized again. */
const createCardDocument = async (card: CardCreate): Promise<void> => {
  const reference = doc(db, CARD_COLLECTION, card.id);
  const existing = await getDocFromCache(reference).catch((error: unknown) => {
    if (error instanceof FirebaseError && error.code === "unavailable") return;
    throw error;
  });
  if (existing?.exists()) {
    const saved = parseCardDocument(card.id, existing.data());
    if (saved.uid !== card.uid || saved.deckId !== card.deckId) throw new Error("Card identity does not match");
    return;
  }
  const createdAt = Date.now();
  const document = omitUndefined({ ...card, fsrs: null, createdAt, updatedAt: createdAt } satisfies RemoteCard);
  void setDoc(reference, document).catch(() => undefined);
};

export function writeCardCreate(batch: WriteBatch, uid: string, card: CardCreateInput): void {
  const input = createCardSchema.parse({ uid, card });
  const createdAt = Date.now();
  const document = omitUndefined({
    ...input.card,
    fsrs: null,
    createdAt,
    updatedAt: createdAt,
  } satisfies RemoteCard);
  batch.set(doc(db, CARD_COLLECTION, input.card.id), document);
}

/** Validates Card ownership before creating its Firestore document. */
export const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
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
    url: card.url,
    startLine: card.startLine,
    endLine: card.endLine,
    updatedAt: Date.now(),
  });
  const reference = doc(db, CARD_COLLECTION, card.id);
  void updateDoc(reference, document).catch(() => undefined);
  return Promise.resolve();
};

/** Validates Card ownership before editing its Firestore document. */
export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};

/** Tombstones a Card so synchronized readers can converge before hiding it. */
const removeCardDocument = (id: string): Promise<void> => {
  const updatedAt = Date.now();
  const reference = doc(db, CARD_COLLECTION, id);
  void updateDoc(reference, { updatedAt, deletedAt: updatedAt }).catch(() => undefined);
  return Promise.resolve();
};

/** Validates Card ownership before tombstoning its Firestore document. */
export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
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
  if (!(input.uid && card) || card.uid !== input.uid || card.deckId !== input.deckId || card.deletedAt !== null)
    throw new Error("Study Card does not match");
  batch.update(doc(db, "card", input.cardId), {
    fsrs: fsrsStateSchema.parse(input.fsrs),
    updatedAt: instantSchema.parse(input.answeredAt),
  });
}

function requireOwnedCard(uid: string, id: CardId) {
  const card = findCardById(id);
  if (card === undefined) throw new Error(`Card "${id}" was not found`);
  if (!uid || card.uid !== uid) throw new Error("Card owner does not match the authenticated user");
  return card;
}

export async function createOwnedCard(uid: string, card: CardCreateCommand): Promise<void> {
  const deck = findDeckById(card.deckId);
  if (deck === undefined) throw new Error(`Deck "${card.deckId}" was not found`);
  if (!uid || deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
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

/** Read all cached active Cards, including earlier writes still waiting to sync. */
export async function readCardsForTagUpdate(uid: string, deckId: string) {
  if (!(uid && deckId)) throw new Error("A user and Deck are required");
  const snapshot = await getDocsFromCache(
    query(
      collection(db, "card"),
      where("uid", "==", uid),
      where("deckId", "==", deckId),
      where("deletedAt", "==", null)
    )
  );
  return snapshot.docs.map((document) => {
    const card = parseCardDocument(document.id, document.data());
    if (card.uid !== uid || card.deckId !== deckId) throw new Error("Card ownership changed");
    return { reference: document.ref, tags: card.tags };
  });
}

export function writeCardTagChanges(
  batch: WriteBatch,
  cards: Awaited<ReturnType<typeof readCardsForTagUpdate>>,
  changes: { previous: string | undefined; name: string | undefined }[]
) {
  for (const card of cards) {
    const tags = [
      ...new Set(
        card.tags.flatMap((original) => {
          let tag: string | undefined = original;
          for (const change of changes) if (change.previous !== undefined && tag === change.previous) tag = change.name;
          return tag === undefined ? [] : [tag];
        })
      ),
    ];
    if (tags.length === card.tags.length && tags.every((tag, index) => tag === card.tags[index])) continue;
    batch.update(card.reference, { tags, updatedAt: Date.now() });
  }
}
