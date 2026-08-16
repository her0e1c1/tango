import type { CardDocumentFields, CardId, CardRead, RemoteCard, RemoteCardRead } from "./types";

export const mapCardDocument = (id: CardId, document: CardDocumentFields): RemoteCardRead => {
  const card: RemoteCardRead = {
    id,
    frontText: document.frontText,
    backText: document.backText,
    tags: document.tags,
    uniqueKey: document.uniqueKey,
    deckId: document.deckId,
    uid: document.uid,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    deletedAt: document.deletedAt,
  };
  if (document.url !== undefined) card.url = document.url;
  if (document.startLine !== undefined) card.startLine = document.startLine;
  if (document.endLine !== undefined) card.endLine = document.endLine;
  return card;
};

export const combineCardRead = ({ card, progress }: CardRead): RemoteCard => {
  // Existing consumers keep the combined shape until #604 migrates them to the separated read contract.
  const combinedCard: RemoteCard = {
    ...card,
    score: progress.score,
    numberOfSeen: progress.numberOfSeen,
  };
  if (progress.lastSeenAt !== undefined) combinedCard.lastSeenAt = progress.lastSeenAt;
  if (progress.nextSeeingAt !== undefined) combinedCard.nextSeeingAt = progress.nextSeeingAt;
  if (progress.interval !== undefined) combinedCard.interval = progress.interval;
  return combinedCard;
};
