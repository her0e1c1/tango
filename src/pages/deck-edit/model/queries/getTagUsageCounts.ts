import type { Card } from "@/entities/card";

function updatedTag(original: string, changes: { previous: string | undefined; name: string | undefined }[]) {
  const change = changes.find(({ previous }) => previous === original);
  return change === undefined ? original : change.name;
}

export function getTagUsageCounts(
  cards: Card[],
  changes: { previous: string | undefined; name: string | undefined }[]
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const cardTags = new Set<string>();
    for (const original of new Set(card.tags)) {
      const tag = updatedTag(original, changes);
      if (tag !== undefined) cardTags.add(tag);
    }
    for (const tag of cardTags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return counts;
}
