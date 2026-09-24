import type { Card } from "@/entities/card";

export function getTagUsageCounts(cards: Card[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const tag of new Set(card.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return counts;
}
