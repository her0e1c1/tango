import type { CardContentInput, CardId } from "@/entities/card";

export interface SubmitCardFormInput {
  cardId: CardId;
  values: CardContentInput;
}
