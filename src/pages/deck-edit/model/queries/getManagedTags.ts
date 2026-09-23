import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

export function getManagedTags(deck: Deck | undefined, cards: Card[]): string[] {
  return [...new Set([...(deck?.tags ?? []), ...cards.flatMap((card) => card.tags)])];
}
