import type { Deck, DeckCreate } from "@/entities/deck";

import { doc, setDoc } from "firebase/firestore";

import { db } from "@/shared/firebase";
import { getTimestamp, omitUndefined } from "@/shared/firestore";

export const createDeckDocument = async (deck: DeckCreate): Promise<string> => {
  const createdAt = getTimestamp();
  const document = omitUndefined({ ...deck, createdAt, updatedAt: createdAt } satisfies Deck);
  await setDoc(doc(db, "deck", deck.id), document);
  return deck.id;
};
