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

import { createStudyProgress, mapStudyProgressDocument, type StudyProgress } from "@/entities/study-progress/@x/card";
import { db } from "@/shared/firebase";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { omitUndefined } from "@/shared/lib/omitUndefined";
import { mapCardDocument } from "../model/dto";
import { createCardSchema, deleteCardSchema, editCardSchema } from "../model/schema";
import { type CardDocument, parseCardDocument } from "./document";

const CARD_COLLECTION = "card";

/** @public Cross-Entity read contract for the two models sharing one physical Card document. */
export interface CardRead {
  card: RemoteCard;
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

/** Subscribes to Card documents as separated Card and StudyProgress models. */
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

/** Fetches Card documents once as separated Card and StudyProgress models. */
export const fetchCardReads = async (uid: string): Promise<CardRead[]> => {
  const snapshot = await getDocsFromServer(query(collection(db, CARD_COLLECTION), where("uid", "==", uid)));
  return mapActiveCardReads(snapshot.docs);
};

/** Writes a new physical Card document with synchronized creation and update timestamps. */
const createCardDocument = async (card: CardCreate): Promise<void> => {
  const createdAt = getCurrentTimeMillis();
  const progress = createStudyProgress(card.id);
  // The shared physical document starts both models, but progress never enters the Card domain input.
  const document = omitUndefined({
    ...card,
    score: progress.score,
    numberOfSeen: progress.numberOfSeen,
    createdAt,
    updatedAt: createdAt,
  } satisfies CardDocument);
  await setDoc(doc(db, CARD_COLLECTION, card.id), document);
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
