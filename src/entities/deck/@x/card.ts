import type { Deck } from "../model/deck";

export type DeckForCard = Pick<Deck, "id" | "uid">;
