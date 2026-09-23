import type { Dispatch, SetStateAction } from "react";
import type { CardFilter, Deck } from "@/entities/deck";

export type DeckFilterValues = CardFilter;
export interface DeckFilterDraft {
  key: string;
  draft: DeckFilterValues;
  pending?: Promise<void> | undefined;
}
export type SetDeckFilterDraft = Dispatch<SetStateAction<DeckFilterDraft>>;

export type DeckFilterScope = "study" | "card";

export interface UpdateDeckFilterOptions {
  scope?: DeckFilterScope;
  uid: string;
  deckId: Deck["id"];
  draft: DeckFilterValues;
  setState: SetDeckFilterDraft;
}
