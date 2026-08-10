/**
 * @file Implements the Firestore adapter responsibility for Dto.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import type { Timestamp } from "firebase/firestore";
import { z } from "zod";

const validDateSchema = z.date().refine((value) => !Number.isNaN(value.getTime()), "Invalid date");
const timestampSchema = z.custom<Timestamp>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    typeof Reflect.get(value, "toDate") === "function" &&
    Number.isInteger(Reflect.get(value, "seconds")) &&
    Number.isInteger(Reflect.get(value, "nanoseconds")) &&
    Reflect.get(value, "nanoseconds") >= 0 &&
    Reflect.get(value, "nanoseconds") < 1_000_000_000,
  "Expected a Firestore Timestamp"
);
const timestampOrDateSchema = z.union([validDateSchema, timestampSchema]).transform((value, context) => {
  if (value instanceof Date) return value;
  try {
    const date = value.toDate();
    if (!Number.isNaN(date.getTime())) return date;
  } catch {
    // The validation issue below keeps malformed Timestamp-like values inside the DTO error boundary.
  }
  context.addIssue({ code: "custom", message: "Invalid Firestore Timestamp" });
  return z.NEVER;
});

const deckDocumentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  url: z.string().optional(),
  isPublic: z.boolean(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  scoreMax: z.number().nullable(),
  scoreMin: z.number().nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

const deckCreateDtoSchema = deckDocumentSchema.extend({
  id: z.string(),
});

const deckUpdateDtoSchema = deckDocumentSchema.omit({ id: true }).partial().extend({
  updatedAt: z.number(),
});

type DeckDocument = z.infer<typeof deckDocumentSchema>;
export type DeckCreateDto = z.infer<typeof deckCreateDtoSchema>;
export type DeckUpdateDto = z.infer<typeof deckUpdateDtoSchema>;

export class FirestoreDocumentValidationError extends Error {
  constructor(
    readonly collectionName: "deck" | "card",
    readonly documentId: string,
    readonly issues: z.core.$ZodIssue[]
  ) {
    const details = issues
      .map((issue) => `${issue.path.length === 0 ? "<document>" : issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    super(`Invalid Firestore ${collectionName} document "${documentId}": ${details}`);
    this.name = "FirestoreDocumentValidationError";
  }
}

const parseDocument = <T>(schema: z.ZodType<T>, collectionName: "deck" | "card", id: string, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new FirestoreDocumentValidationError(collectionName, id, result.error.issues);
  }
  return result.data;
};

const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseDocument(deckDocumentSchema, "deck", id, value);

/**
 * Converts deck document into the shape used by the next application layer.
 * The mapping keeps storage-specific representations out of domain and component code.
 */
export const mapDeckDocument = (id: DeckId, value: unknown): Deck => {
  const document = parseDeckDocument(id, value);
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
  const documentUrl = document.url;
  if (documentUrl !== undefined) deck.url = documentUrl;
  return deck;
};

const cardDocumentSchema = z.object({
  id: z.string().optional(),
  frontText: z.string(),
  backText: z.string(),
  tags: z.array(z.string()),
  uniqueKey: z.string(),
  deckId: z.string(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  score: z.number(),
  numberOfSeen: z.number(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: timestampOrDateSchema.optional(),
  interval: z.number().optional(),
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});

const cardCreateDtoSchema = cardDocumentSchema.extend({
  id: z.string(),
});

const cardUpdateDtoSchema = cardDocumentSchema.omit({ id: true }).partial().extend({
  updatedAt: z.number(),
});

type CardDocument = z.infer<typeof cardDocumentSchema>;
export type CardCreateDto = z.infer<typeof cardCreateDtoSchema>;
export type CardUpdateDto = z.infer<typeof cardUpdateDtoSchema>;

const parseCardDocument = (id: CardId, value: unknown): CardDocument =>
  parseDocument(cardDocumentSchema, "card", id, value);

/**
 * Converts card document into the shape used by the next application layer.
 * The mapping keeps storage-specific representations out of domain and component code.
 */
export const mapCardDocument = (id: CardId, value: unknown): Card => {
  const document = parseCardDocument(id, value);
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
  if (document.nextSeeingAt !== undefined) card.nextSeeingAt = document.nextSeeingAt;
  if (document.interval !== undefined) card.interval = document.interval;
  const documentUrl = document.url;
  if (documentUrl !== undefined) card.url = documentUrl;
  if (document.startLine !== undefined) card.startLine = document.startLine;
  if (document.endLine !== undefined) card.endLine = document.endLine;
  return card;
};

type OmitUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

/**
 * Copies an object while removing properties whose value is `undefined`.
 * Firestore receives only concrete fields, while optional fields that are intentionally absent
 * stay omitted.
 */
const omitUndefined = <T extends Record<string, unknown>>(value: T): OmitUndefined<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as OmitUndefined<T>;

/**
 * Builds deck create dto from the supplied application values.
 * The returned value is ready for the next layer, so callers do not need to repeat assembly or
 * defaulting rules.
 */
export const buildDeckCreateDto = (deck: Deck, createdAt: number): DeckCreateDto =>
  deckCreateDtoSchema.parse(
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
    })
  );

/**
 * Builds deck update dto from the supplied application values.
 * The returned value is ready for the next layer, so callers do not need to repeat assembly or
 * defaulting rules.
 */
export const buildDeckUpdateDto = (deck: DeckEdit, updatedAt: number): DeckUpdateDto =>
  deckUpdateDtoSchema.parse(
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
    })
  );

/**
 * Builds card create dto from the supplied application values.
 * The returned value is ready for the next layer, so callers do not need to repeat assembly or
 * defaulting rules.
 */
export const buildCardCreateDto = (card: Card, createdAt: number): CardCreateDto =>
  cardCreateDtoSchema.parse(
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
    })
  );

/**
 * Builds card update dto from the supplied application values.
 * The returned value is ready for the next layer, so callers do not need to repeat assembly or
 * defaulting rules.
 */
export const buildCardUpdateDto = (card: CardEdit, updatedAt: number): CardUpdateDto =>
  cardUpdateDtoSchema.parse(
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
    })
  );
