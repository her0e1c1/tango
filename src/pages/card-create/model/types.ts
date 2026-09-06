import type { z } from "zod";

import type { cardCreateFormSchema } from "./schema";

export type CardCreateFormValues = z.infer<typeof cardCreateFormSchema>;

export interface SubmitCardCreateInput {
  uid: string;
  deckId: string;
  values: CardCreateFormValues;
}
