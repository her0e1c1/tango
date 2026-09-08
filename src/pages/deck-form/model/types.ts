import type { Deck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

export interface SubmitDeckFormInput {
  deck: Pick<Deck, "id" | "localMode">;
  values: DeckFormFields;
}
