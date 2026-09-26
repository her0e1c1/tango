import type { Card, CardContentInput } from "@/entities/card";

export function isCardEditAcknowledged(card: Card, pending: CardContentInput | undefined): pending is CardContentInput {
  return (
    pending !== undefined &&
    card.frontText === pending.frontText &&
    card.backText === pending.backText &&
    card.tags.length === pending.tags.length &&
    card.tags.every((tag, index) => tag === pending.tags[index])
  );
}
