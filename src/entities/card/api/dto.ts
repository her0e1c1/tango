import type { Card, CardId } from "../model/schema";

import { parseCardDto } from "@/shared/firestore";

export const convertCardDtoToCard = (id: CardId, value: unknown): Card => {
  const dto = parseCardDto(id, value);
  const card: Card = {
    id,
    frontText: dto.frontText,
    backText: dto.backText,
    tags: dto.tags,
    uniqueKey: dto.uniqueKey,
    deckId: dto.deckId,
    uid: dto.uid,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
    score: dto.score,
    numberOfSeen: dto.numberOfSeen,
  };
  if (dto.lastSeenAt !== undefined) card.lastSeenAt = dto.lastSeenAt;
  if (dto.nextSeeingAt !== undefined) card.nextSeeingAt = dto.nextSeeingAt;
  if (dto.interval !== undefined) card.interval = dto.interval;
  if (dto.url !== undefined) card.url = dto.url;
  if (dto.startLine !== undefined) card.startLine = dto.startLine;
  if (dto.endLine !== undefined) card.endLine = dto.endLine;
  return card;
};
