import type { z } from "zod";
import type { CardId } from "@/entities/card";
import type { cardFormSchema } from "./schema";

export type CardFormValues = z.infer<typeof cardFormSchema>;

export interface SubmitCardFormInput {
  cardId: CardId;
  values: CardFormValues;
}
