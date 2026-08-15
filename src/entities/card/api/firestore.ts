import type {
  Card,
  CardCreate,
  CardCreateInput,
  CardEdit,
  CardId,
  DeleteCardInput,
  EditCardInput,
} from "../model/types";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  type Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { z } from "zod";

import { db } from "@/shared/api";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { replaceCards } from "../model/store";

const CARD_COLLECTION = "card";

export interface CardSubscriptionEvent {
  serverConfirmed: boolean;
}

const validJavaScriptDateSchema = z.date().refine((value) => !Number.isNaN(value.getTime()), "Invalid date");
const firestoreTimestampSchema = z.custom<Timestamp>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    typeof Reflect.get(value, "toDate") === "function" &&
    Number.isInteger(Reflect.get(value, "seconds")) &&
    Number.isInteger(Reflect.get(value, "nanoseconds")) &&
    Reflect.get(value, "nanoseconds") >= 0 &&
    Reflect.get(value, "nanoseconds") < 1_000_000_000,
  "Expected a Firestore Timestamp"
);

const firestoreTimestampDateSchema = z
  .union([validJavaScriptDateSchema, firestoreTimestampSchema])
  .transform((value, context) => {
    if (value instanceof Date) return value;
    try {
      const date = value.toDate();
      if (!Number.isNaN(date.getTime())) return date;
    } catch {
      // Report malformed Timestamp implementations through the schema error boundary below.
    }
    context.addIssue({ code: "custom", message: "Invalid Firestore Timestamp" });
    return z.NEVER;
  });

class FirestoreDocumentValidationError extends Error {
  constructor(
    readonly collectionName: string,
    readonly documentId: string,
    readonly issues: z.core.$ZodIssue[]
  ) {
    const details = issues
      .map((issue) => `${issue.path.length === 0 ? "<document>" : issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    super(`Invalid Firestore ${collectionName} document "${documentId}": ${details}`);
    this.name = "FirestoreDocumentValidationError";
  }
}

const parseFirestoreDocument = <T>(
  schema: z.ZodType<T>,
  collectionName: string,
  documentId: string,
  value: unknown
): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new FirestoreDocumentValidationError(collectionName, documentId, result.error.issues);
  }
  return result.data;
};

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
  const dto: CardDto = parseFirestoreDocument(cardDtoSchema, CARD_COLLECTION, id, value);
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

export const subscribeCards = (
  uid: string,
  onError: (error: Error) => void,
  onData: (event: CardSubscriptionEvent) => void = () => undefined
): (() => void) =>
  onSnapshot(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      try {
        const cards = snapshot.docs
          .map((document) => convertCardDtoToCard(document.id, document.data()))
          .filter((card) => card.deletedAt === null);
        replaceCards(cards);
        const serverConfirmed = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
        onData({ serverConfirmed });
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
  const createdAt = Date.now();
  const document = { ...card, createdAt, updatedAt: createdAt } satisfies Card;
  await setDoc(doc(db, CARD_COLLECTION, card.id), document);
};

export const createCard = async (uid: string, card: CardCreateInput): Promise<void> => {
  const input = createCardSchema.parse({ uid, card });
  await createCardDocument(input.card);
};

const updateCardDocument = async (card: CardEdit): Promise<void> => {
  const document = {
    frontText: card.frontText,
    backText: card.backText,
    tags: card.tags,
    uniqueKey: card.uniqueKey,
    url: card.url,
    startLine: card.startLine,
    endLine: card.endLine,
    updatedAt: Date.now(),
  };
  await updateDoc(doc(db, CARD_COLLECTION, card.id), document);
};

export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};

const removeCardDocument = async (id: string): Promise<void> => {
  const updatedAt = Date.now();
  await updateDoc(doc(db, CARD_COLLECTION, id), { updatedAt, deletedAt: updatedAt });
};

export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const input = deleteCardSchema.parse({ uid, card });
  await removeCardDocument(input.card.id);
};
