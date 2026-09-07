import type { CardContentInput } from "@/entities/card";

export interface SubmitCardCreateInput {
  uid: string;
  deckId: string;
  values: CardContentInput;
}
