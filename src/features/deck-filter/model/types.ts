import type { Dispatch, SetStateAction } from "react";
import type { Deck } from "@/entities/deck";

export type DeckFilterValues = Pick<Deck, "difficultyMax" | "difficultyMin" | "selectedTags" | "tagAndFilter">;
export interface DeckFilterDraft {
  key: string;
  draft: DeckFilterValues;
  pending?: Promise<void> | undefined;
}
export type SetDeckFilterDraft = Dispatch<SetStateAction<DeckFilterDraft>>;

export interface UpdateDeckFilterOptions {
  uid: string;
  deckId: Deck["id"];
  draft: DeckFilterValues;
  setState: SetDeckFilterDraft;
  errorMessage: string;
}
