import type { Deck } from "../model/schema";

export type DeckForCard = Pick<Deck, "id" | "uid">;
