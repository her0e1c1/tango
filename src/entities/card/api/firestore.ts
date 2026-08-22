import type {
  CardCreate,
  CardCreateInput,
  CardEdit,
  CardId,
  DeleteCardInput,
  EditCardInput,
  RemoteCard,
  RemoteCardRead,
} from "../model/types";
import type { WriteBatch } from "firebase/firestore";

import { collection, doc, getDocsFromServer, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";

import { mapStudyProgressDocument, type StudyProgress } from "@/entities/study-progress/@x/card";
import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { mapCardDocument } from "../model/dto";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { replaceRemoteCards } from "../model/store";
import { parseCardDocument } from "./document";

const CARD_COLLECTION = "card";

/** @public Cross-Entity read contract for the two models sharing one physical Card document. */
export interface CardRead {
  card: RemoteCardRead;
  progress: StudyProgress;
}

/** Maps one physical Card document into independent Card and StudyProgress read models. */
const mapCardRead = (id: CardId, value: unknown): CardRead => {
  // Both Entities share one physical document, so their mappings must observe the same validated snapshot.
  const document = parseCardDocument(id, value);
  return {
    card: mapCardDocument(id, document),
    progress: mapStudyProgressDocument(id, document),
  };
};

/** Maps active documents and omits tombstones from both read paths. */
const mapActiveCardReads = (documents: ReadonlyArray<{ id: string; data: () => unknown }>): CardRead[] =>
  documents.map((document) => mapCardRead(document.id, document.data())).filter(({ card }) => card.deletedAt === null);

/** @public Lets later consumers adopt separated reads without changing current Card state in this PR. */
export const subscribeCardReads = (
  uid: string,
  onReads: (reads: CardRead[]) => void,
  onError: (error: Error) => void
): (() => void) =>
  onSnapshot(
    query(collection(db, CARD_COLLECTION), where("uid", "==", uid)),
    (snapshot) => {
      try {
        onReads(mapActiveCardReads(snapshot.docs));
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );

// Existing consumers stay behind the combined Card API until #604 migrates them to separated reads.
const combineCardRead = ({ card, progress }: CardRead): RemoteCard => {
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

/** Keeps existing Card subscribers on the combined read model until #604. */
export const subscribeCards = (uid: string, onError: (error: Error) => void): (() => void) =>
  subscribeCardReads(uid, (reads) => replaceRemoteCards(reads.map(combineCardRead)), onError);

/** @public Fetch counterpart to subscribeCardReads for the separated read boundary. */
export const fetchCardReads = async (uid: string): Promise<CardRead[]> => {
  const snapshot = await getDocsFromServer(query(collection(db, CARD_COLLECTION), where("uid", "==", uid)));
  return mapActiveCardReads(snapshot.docs);
};

/** Builds a physical Card document with synchronized creation and update timestamps. */
const toCardDocument = (card: CardCreate, createdAt: number): RemoteCard =>
  omitUndefined({ ...card, createdAt, updatedAt: createdAt } satisfies RemoteCard);

/** Writes a new physical Card document with synchronized creation and update timestamps. */
const createCardDocument = async (card: CardCreate): Promise<void> => {
  const document = toCardDocument(card, getCurrentTimeMillis());
  await setDoc(doc(db, CARD_COLLECTION, card.id), document);
};

/** Adds validated Card creates to a caller-owned batch so a parent Deck graph can commit atomically. */
export const addCardCreatesToBatch = (
  batch: WriteBatch,
  uid: string,
  cards: CardCreateInput[],
  createdAt: number
): void => {
  for (const card of cards) {
    const input = createCardSchema.parse({ uid, card });
    batch.set(doc(db, CARD_COLLECTION, input.card.id), toCardDocument(input.card, createdAt));
  }
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
    updatedAt: getCurrentTimeMillis(),
  });
  await updateDoc(doc(db, CARD_COLLECTION, card.id), document);
};

/** Validates Card ownership before editing its Firestore document. */
export const editCard = async (uid: string, card: EditCardInput["card"]): Promise<void> => {
  const input = editCardSchema.parse({ uid, card });
  await updateCardDocument(input.card);
};

/** Tombstones a Card so synchronized readers can converge before hiding it. */
const removeCardDocument = async (id: string): Promise<void> => {
  const updatedAt = getCurrentTimeMillis();
  await updateDoc(doc(db, CARD_COLLECTION, id), { updatedAt, deletedAt: updatedAt });
};

/** Validates Card ownership before tombstoning its Firestore document. */
export const deleteCard = async (uid: string, card: DeleteCardInput["card"]): Promise<void> => {
  const input = deleteCardSchema.parse({ uid, card });
  await removeCardDocument(input.card.id);
};
