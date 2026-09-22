import { doc, type WriteBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import type { FsrsState } from "../model/schema";
import { getCardStudyState } from "../model/queries/getCardStudyState";
import { cardStudyStateDocumentSchema } from "./document";
import { cardStudyStateId } from "./id";

export function writeCardStudyState(
  batch: WriteBatch,
  input: {
    uid: string;
    cardId: string;
    deckId: string;
    fsrs: FsrsState;
    answeredAt: number;
  }
) {
  const previous = getCardStudyState(input.cardId);
  if (previous && previous.uid !== input.uid) throw new Error("Card study state owner does not match");
  const reference = doc(db, "cardStudyState", cardStudyStateId(input.uid, input.cardId));
  batch.set(
    reference,
    cardStudyStateDocumentSchema.parse({
      schemaVersion: 1,
      uid: input.uid,
      cardId: input.cardId,
      deckId: input.deckId,
      fsrs: input.fsrs,
      createdAt: previous?.createdAt ?? input.answeredAt,
      updatedAt: input.answeredAt,
    })
  );
  return reference;
}
