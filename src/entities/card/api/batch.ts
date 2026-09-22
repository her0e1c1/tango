import { doc, type WriteBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { fsrsStateSchema, instantSchema, type FsrsState } from "../model/fsrs";
import { findCardById } from "../model/queries/findCardById";

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
  if (!input.uid || !card || card.uid !== input.uid || card.deckId !== input.deckId || card.deletedAt !== null)
    throw new Error("Study Card does not match");
  const reference = doc(db, "card", input.cardId);
  batch.update(reference, {
    fsrs: fsrsStateSchema.parse(input.fsrs),
    updatedAt: instantSchema.parse(input.answeredAt),
  });
  return reference;
}
