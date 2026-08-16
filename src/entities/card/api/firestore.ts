import type {
  CardCreate,
  CardCreateInput,
  CardEdit,
  CardId,
  DeleteCardInput,
  EditCardInput,
  RemoteCard,
} from "../model/types";

import { collection, doc, getDocsFromServer, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { replaceRemoteCards } from "../model/store";
import { type CardReadModels, readCardDocument } from "./document";

const CARD_COLLECTION = "card";

const combineCardReadModels = ({ card, progress }: CardReadModels): RemoteCard => {
  // Consumers still receive the combined shape until they migrate together; composition stays at this boundary.
  const combinedCard: RemoteCard = {
    ...card,
    score: progress.score,
    numberOfSeen: progress.numberOfSeen,
  };
  if (progress.lastSeenAt !== undefined) combinedCard.lastSeenAt = progress.lastSeenAt;
  if (progress.nextSeeingAt !== undefined) combinedCard.nextSeeingAt = progress.nextSeeingAt;
  if (progress.interval !== undefined) combinedCard.interval = progress.interval;
  return combinedCard;
};

const convertCardDocumentToCard = (id: CardId, value: unknown): RemoteCard =>
  combineCardReadModels(readCardDocument(id, value));

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

export const fetchCards = async (uid: string): Promise<RemoteCard[]> => {
  const snapshot = await getDocsFromServer(query(collection(db, CARD_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => convertCardDocumentToCard(document.id, document.data()))
    .filter((card) => card.deletedAt === null);
};

const createCardDocument = async (card: CardCreate): Promise<void> => {
  const createdAt = getCurrentTimeMillis();
  const document = omitUndefined({ ...card, createdAt, updatedAt: createdAt } satisfies RemoteCard);
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
