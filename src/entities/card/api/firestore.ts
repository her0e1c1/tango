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

export interface CardRead {
  card: RemoteCardRead;
  progress: StudyProgress;
}

const mapCardRead = (id: CardId, value: unknown): CardRead => {
  // Both Entities share one physical document, so their mappings must observe the same validated snapshot.
  const document = parseCardDocument(id, value);
  return {
    card: mapCardDocument(id, document),
    progress: mapStudyProgressDocument(id, document),
  };
};

const mapActiveCardReads = (documents: ReadonlyArray<{ id: string; data: () => unknown }>): CardRead[] =>
  documents.map((document) => mapCardRead(document.id, document.data())).filter(({ card }) => card.deletedAt === null);

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

const fetchCardReads = async (uid: string): Promise<CardRead[]> => {
  const snapshot = await getDocsFromServer(query(collection(db, CARD_COLLECTION), where("uid", "==", uid)));
  return mapActiveCardReads(snapshot.docs);
};

const combineCardRead = ({ card, progress }: CardRead): RemoteCard => {
  // Existing consumers keep the combined shape until #604 migrates them to the separated read contract.
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

export const replaceRemoteCardsFromReads = (reads: CardRead[]): void => {
  replaceRemoteCards(reads.map(combineCardRead));
};

export const fetchCards = async (uid: string): Promise<RemoteCard[]> =>
  (await fetchCardReads(uid)).map(combineCardRead);

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
