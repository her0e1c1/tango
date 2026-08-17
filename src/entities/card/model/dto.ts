import type { CardDocumentFields, CardId, RemoteCard } from "./types";

/** Maps only Card-owned document fields while preserving exact optional-property semantics. */
export const mapCardDocument = (id: CardId, document: CardDocumentFields): RemoteCard => {
  const card: RemoteCard = {
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
