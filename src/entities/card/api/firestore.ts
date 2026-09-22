import type { CardCreate, CardCreateInput, CardEdit, DeleteCardInput, EditCardInput, RemoteCard } from "../model/types";

import { FirebaseError } from "firebase/app";
import { getDocFromCache, collection, doc, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";

import { writeLocally } from "@/shared/firestore-write";
import { db } from "@/shared/firebase";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { mapCardDocument } from "../model/dto";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { replaceRemoteCards } from "../model/actions/replaceRemoteCards";
import { parseCardDocument } from "./document";

const CARD_COLLECTION = "card";

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
    if (error instanceof FirebaseError && error.code === "unavailable") return undefined;
    throw error;
  });
  if (existing?.exists()) {
    const saved = parseCardDocument(card.id, existing.data());
    if (saved.uid !== card.uid || saved.deckId !== card.deckId) throw new Error("Card identity does not match");
    return;
  }
  const createdAt = Date.now();
  const document = omitUndefined({ ...card, fsrs: null, createdAt, updatedAt: createdAt } satisfies RemoteCard);
  await writeLocally(card.uid, [reference], () => setDoc(reference, document));
};

/** Validates Card ownership before creating its Firestore document. */
export const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
  const input = createCardSchema.parse({ uid, card });
  await createCardDocument(input.card);
};

/** Writes the editable Card fields and advances the update timestamp. */
const updateCardDocument = async (card: CardEdit): Promise<void> => {
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
  await writeLocally(card.uid, [reference], () => updateDoc(reference, document));
};

/** Validates Card ownership before editing its Firestore document. */
export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};

/** Tombstones a Card so synchronized readers can converge before hiding it. */
const removeCardDocument = async (uid: string, id: string): Promise<void> => {
  const updatedAt = Date.now();
  const reference = doc(db, CARD_COLLECTION, id);
  await writeLocally(uid, [reference], () => updateDoc(reference, { updatedAt, deletedAt: updatedAt }));
};

/** Validates Card ownership before tombstoning its Firestore document. */
export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const input = deleteCardSchema.parse({ uid, card });
  await removeCardDocument(input.uid, input.card.id);
};
