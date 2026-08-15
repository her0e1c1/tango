import type * as z from "zod";

import { editableDeckFieldsSchema } from "@/entities/deck";

export const deckFormSchema = editableDeckFieldsSchema.pick({
  name: true,
  category: true,
  url: true,
  convertToBr: true,
});

export type DeckFormValues = z.infer<typeof deckFormSchema>;
