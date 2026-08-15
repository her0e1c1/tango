import type {
  Card,
  CardCreate,
  CardCreateInput,
  CardEdit,
  CardId,
  DeleteCardInput,
  EditCardInput,
} from "../model/types";

import { collection, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import { z } from "zod";

import { db } from "@/shared/api/firebase";
import {
  firestoreTimestampDateSchema,
  getTimestamp,
  omitUndefined,
  parseFirestoreDocument,
} from "@/shared/api/firestoreDocument";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { replaceCards } from "../model/store";

const CARD_COLLECTION = "card";

const cardDtoSchema = z.object({
  id: z.string().optional(),
  frontText: z.string(),
  backText: z.string(),
  tags: z.array(z.string()),
  uniqueKey: z.string(),
  deckId: z.string(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  score: z.number(),
  numberOfSeen: z.number(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: firestoreTimestampDateSchema.optional(),
  interval: z.number().optional(),
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

type CardDto = z.infer<typeof cardDtoSchema>;

const convertCardDtoToCard = (id: CardId, value: unknown): Card => {
  const dto: CardDto = parseFirestoreDocument(cardDtoSchema, "card", id, value);
  const card: Card = {
    id,
    frontText: dto.frontText,
    backText: dto.backText,
    tags: dto.tags,
    uniqueKey: dto.uniqueKey,
    deckId: dto.deckId,
    uid: dto.uid,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
    score: dto.score,
    numberOfSeen: dto.numberOfSeen,
  };
  if (dto.lastSeenAt !== undefined) card.lastSeenAt = dto.lastSeenAt;
  if (dto.nextSeeingAt !== undefined) card.nextSeeingAt = dto.nextSeeingAt;
  if (dto.interval !== undefined) card.interval = dto.interval;
  if (dto.url !== undefined) card.url = dto.url;
  if (dto.startLine !== undefined) card.startLine = dto.startLine;
  if (dto.endLine !== undefined) card.endLine = dto.endLine;
  return card;
};

export const subscribeCards = (uid: string, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const cards = snapshot.docs
          .map((document) => convertCardDtoToCard(document.id, document.data()))
          .filter((card) => card.deletedAt === null);
        replaceCards(cards);
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

export const fetchCards = async (uid: string): Promise<Card[]> => {
  const snapshot = await getDocs(query(collection(db, CARD_COLLECTION), where("uid", "==", uid)));
  return snapshot.docs
    .map((document) => convertCardDtoToCard(document.id, document.data()))
    .filter((card) => card.deletedAt === null);
};

export const generateCardId = (): string => doc(collection(db, CARD_COLLECTION)).id;

const createCardDocument = async (card: CardCreate): Promise<void> => {
  const createdAt = getTimestamp();
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
    updatedAt: getTimestamp(),
  });
  await updateDoc(doc(db, CARD_COLLECTION, card.id), document);
};

export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};

const removeCardDocument = async (id: string): Promise<void> => {
  const updatedAt = getTimestamp();
  await updateDoc(doc(db, CARD_COLLECTION, id), { updatedAt, deletedAt: updatedAt });
};

export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const input = deleteCardSchema.parse({ uid, card });
  await removeCardDocument(input.card.id);
};
