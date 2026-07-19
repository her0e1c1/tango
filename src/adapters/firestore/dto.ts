export interface DeckDocument {
  id: DeckId;
  name: string;
  url?: string;
  isPublic: boolean;
  uid: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  category: Category;
  convertToBr: boolean;
}

export type DeckUpdateDto = Partial<Omit<DeckDocument, "id" | "updatedAt">> & Pick<DeckDocument, "updatedAt">;

export const mapDeckDocument = (id: DeckId, document: DeckDocument): Deck => {
  const deck: Deck = {
    id,
    name: document.name,
    isPublic: document.isPublic,
    uid: document.uid,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    deletedAt: document.deletedAt,
    scoreMax: document.scoreMax,
    scoreMin: document.scoreMin,
    selectedTags: document.selectedTags,
    tagAndFilter: document.tagAndFilter,
    category: document.category,
    convertToBr: document.convertToBr,
  };
  if (document.url !== undefined) deck.url = document.url;
  return deck;
};

export interface CardDocument {
  id: CardId;
  frontText: string;
  backText: string;
  tags: string[];
  uniqueKey: string;
  deckId: DeckId;
  uid: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  score: number;
  numberOfSeen: number;
  lastSeenAt?: number;
  nextSeeingAt?: Date | { toDate: () => Date };
  interval?: number;
  url?: string;
  startLine?: number;
  endLine?: number;
}

export type CardUpdateDto = Partial<Omit<CardDocument, "id" | "updatedAt">> & Pick<CardDocument, "updatedAt">;

export const mapCardDocument = (id: CardId, document: CardDocument): Card => {
  const card: Card = {
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
    score: document.score,
    numberOfSeen: document.numberOfSeen,
  };
  if (document.lastSeenAt !== undefined) card.lastSeenAt = document.lastSeenAt;
  if (document.nextSeeingAt !== undefined) {
    card.nextSeeingAt = document.nextSeeingAt instanceof Date ? document.nextSeeingAt : document.nextSeeingAt.toDate();
  }
  if (document.interval !== undefined) card.interval = document.interval;
  if (document.url !== undefined) card.url = document.url;
  if (document.startLine !== undefined) card.startLine = document.startLine;
  if (document.endLine !== undefined) card.endLine = document.endLine;
  return card;
};

type OmitUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

const omitUndefined = <T extends Record<string, unknown>>(value: T): OmitUndefined<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as OmitUndefined<T>;

export const buildDeckCreateDto = (deck: Deck, createdAt: number): DeckDocument =>
  omitUndefined({
    id: deck.id,
    name: deck.name,
    url: deck.url,
    isPublic: deck.isPublic,
    uid: deck.uid,
    createdAt,
    updatedAt: createdAt,
    deletedAt: deck.deletedAt,
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
  });

export const buildDeckUpdateDto = (deck: DeckEdit, updatedAt: number): DeckUpdateDto =>
  omitUndefined({
    name: deck.name,
    url: deck.url,
    isPublic: deck.isPublic,
    uid: deck.uid,
    createdAt: deck.createdAt,
    updatedAt,
    deletedAt: deck.deletedAt,
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
    category: deck.category,
    convertToBr: deck.convertToBr,
  });

export const buildCardCreateDto = (card: Card, createdAt: number): CardDocument =>
  omitUndefined({
    id: card.id,
    frontText: card.frontText,
    backText: card.backText,
    tags: card.tags,
    uniqueKey: card.uniqueKey,
    deckId: card.deckId,
    uid: card.uid,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    score: card.score,
    numberOfSeen: card.numberOfSeen,
    lastSeenAt: card.lastSeenAt,
    nextSeeingAt: card.nextSeeingAt,
    interval: card.interval,
    url: card.url,
    startLine: card.startLine,
    endLine: card.endLine,
  });

export const buildCardUpdateDto = (card: CardEdit, updatedAt: number): CardUpdateDto =>
  omitUndefined({
    frontText: card.frontText,
    backText: card.backText,
    tags: card.tags,
    uniqueKey: card.uniqueKey,
    deckId: card.deckId,
    uid: card.uid,
    createdAt: card.createdAt,
    updatedAt,
    deletedAt: card.deletedAt,
    score: card.score,
    numberOfSeen: card.numberOfSeen,
    lastSeenAt: card.lastSeenAt,
    nextSeeingAt: card.nextSeeingAt,
    interval: card.interval,
    url: card.url,
    startLine: card.startLine,
    endLine: card.endLine,
  });
