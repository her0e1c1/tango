import type {
  Card,
  CardCreate,
  CardCreateInput,
  CardEdit,
  CardId,
  DeleteCardInput,
  EditCardInput,
} from "../model/types";

import { collection, doc, getDocsFromServer, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { replaceRemoteCards } from "../model/store";
import { parseCardDocument } from "./document";

const CARD_COLLECTION = "card";

const convertCardDocumentToCard = (id: CardId, value: unknown): Card => {
  const document = parseCardDocument(id, value);
  const card: Card = {
    id,
    frontText: document.frontText,
    backText: document.backText,
    tags: document.tags,
    uniqueKey: document.uniqueKey,
    deckId: document.deckId,
    uid: document.uid,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    deletedAt: document.deletedAt,
    score: document.score,
    numberOfSeen: document.numberOfSeen,
  };
  if (document.lastSeenAt !== undefined) card.lastSeenAt = document.lastSeenAt;
  if (document.nextSeeingAt !== undefined) card.nextSeeingAt = document.nextSeeingAt;
  if (document.interval !== undefined) card.interval = document.interval;
  if (document.url !== undefined) card.url = document.url;
  if (document.startLine !== undefined) card.startLine = document.startLine;
  if (document.endLine !== undefined) card.endLine = document.endLine;
  return card;
};

export const subscribeCards = (uid: string, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const cards = snapshot.docs
          .map((document) => convertCardDocumentToCard(document.id, document.data()))
          .filter((card) => card.deletedAt === null);
        replaceRemoteCards(cards);
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

export const fetchCards = async (uid: string): Promise<Card[]> => {
  const snapshot = await getDocsFromServer(query(collection(db, CARD_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => convertCardDocumentToCard(document.id, document.data()))
    .filter((card) => card.deletedAt === null);
};

export const generateCardId = (): string => doc(collection(db, CARD_COLLECTION)).id;

const createCardDocument = async (card: CardCreate): Promise<void> => {
  const createdAt = getCurrentTimeMillis();
  const document = omitUndefined({ ...card, createdAt, updatedAt: createdAt } satisfies Card);
  await setDoc(doc(db, CARD_COLLECTION, card.id), document);
};

export const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
  const input = createCardSchema.parse({ uid, card });
  await createCardDocument(input.card);
};

const updateCardDocument = async (card: CardEdit): Promise<void> => {
  const document = omitUndefined({
    frontText: card.frontText,
    backText: card.backText,
    tags: card.tags,
    uniqueKey: card.uniqueKey,
    url: card.url,
    startLine: card.startLine,
    endLine: card.endLine,
    updatedAt: getCurrentTimeMillis(),
  });
  await updateDoc(doc(db, CARD_COLLECTION, card.id), document);
};

export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};

const removeCardDocument = async (id: string): Promise<void> => {
  const updatedAt = getCurrentTimeMillis();
  await updateDoc(doc(db, CARD_COLLECTION, id), { updatedAt, deletedAt: updatedAt });
};

export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const input = deleteCardSchema.parse({ uid, card });
  await removeCardDocument(input.card.id);
};
