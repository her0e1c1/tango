import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { writeLocally } from "@/shared/firestore-write";
import { cardStudyStateId } from "./id";
import { cardStudyStateStore } from "../model/store";

export async function deleteCardStudyStates(
  uid: string,
  target: { cardId: string } | { deckId: string; cardIds: readonly string[] }
) {
  // A missing cached State is not proof that the server has no State for a known Card.
  const cardIds =
    "cardId" in target
      ? [target.cardId]
      : [
          ...target.cardIds,
          ...Object.values(cardStudyStateStore.getState().states)
            .filter((state) => state.uid === uid && state.deckId === target.deckId)
            .map((state) => state.cardId),
        ];
  await Promise.all(
    [...new Set(cardIds)].map((cardId) => {
      const reference = doc(db, "cardStudyState", cardStudyStateId(uid, cardId));
      return writeLocally(uid, [reference], () => deleteDoc(reference));
    })
  );
}
