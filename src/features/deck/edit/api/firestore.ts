import type { DeckEdit } from "@/entities/deck";

import { doc, updateDoc } from "firebase/firestore";
import { z } from "zod";

import { db } from "@/shared/firebase";
import { getTimestamp, omitUndefined } from "@/shared/firestore";

const deckUpdateSchema = z
  .object({
    name: z.string(),
    url: z.string(),
    isPublic: z.boolean(),
    scoreMax: z.number().nullable(),
    scoreMin: z.number().nullable(),
    selectedTags: z.array(z.string()),
    tagAndFilter: z.boolean(),
    category: z.string(),
    convertToBr: z.boolean(),
  })
  .partial()
  .extend({ updatedAt: z.number() });

export const updateDeckDocument = async (deck: DeckEdit): Promise<void> => {
  const document = deckUpdateSchema.parse(
    omitUndefined({
      name: deck.name,
      url: deck.url,
      isPublic: deck.isPublic,
      updatedAt: getTimestamp(),
      scoreMax: deck.scoreMax,
      scoreMin: deck.scoreMin,
      selectedTags: deck.selectedTags,
      tagAndFilter: deck.tagAndFilter,
      category: deck.category,
      convertToBr: deck.convertToBr,
    })
  );
  await updateDoc(doc(db, "deck", deck.id), document);
};
