/**
 * @file Implements the Firestore adapter responsibility for Dto.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import * as z from "zod";

import type { DeckFilterPatch } from "@/domain/deckFilter";

const finiteNumber = z.number().finite();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

/** Accepts browser Dates and Firestore Timestamp-like values, producing one validated Date. */
const firestoreDateSchema = z.unknown().transform((value, context): Date => {
  let date: unknown = value;
  if (!(value instanceof Date) && isRecord(value) && typeof value.toDate === "function") {
    try {
      date = value.toDate();
    } catch {
      date = undefined;
    }
  }
  if (date instanceof Date && Number.isFinite(date.getTime())) return date;

  context.addIssue({ code: "custom", message: "Expected a valid Date or Firestore Timestamp." });
  return z.NEVER;
});

export const deckDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  isPublic: z.boolean(),
  uid: z.string(),
  createdAt: finiteNumber,
  updatedAt: finiteNumber,
  deletedAt: finiteNumber.nullable(),
  scoreMax: finiteNumber.nullable(),
  scoreMin: finiteNumber.nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

export type DeckDocument = z.infer<typeof deckDocumentSchema>;

const deckUpdateDtoSchema = deckDocumentSchema
  .omit({ id: true, updatedAt: true })
  .partial()
  .extend({ updatedAt: finiteNumber });

export type DeckUpdateDto = z.infer<typeof deckUpdateDtoSchema>;

const deckFilterUpdateDtoSchema = z.object({
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  scoreMax: finiteNumber.nullable(),
  scoreMin: finiteNumber.nullable(),
  updatedAt: finiteNumber,
});

export type DeckFilterUpdateDto = z.infer<typeof deckFilterUpdateDtoSchema>;

export const cardDocumentSchema = z.object({
  id: z.string(),
  frontText: z.string(),
  backText: z.string(),
  tags: z.array(z.string()),
  uniqueKey: z.string(),
  deckId: z.string(),
  uid: z.string(),
  createdAt: finiteNumber,
  updatedAt: finiteNumber,
  deletedAt: finiteNumber.nullable(),
  score: finiteNumber,
  numberOfSeen: z.number().int().min(0),
  lastSeenAt: finiteNumber.optional(),
  nextSeeingAt: firestoreDateSchema.optional(),
  interval: finiteNumber.optional(),
  url: z.string().optional(),
  startLine: finiteNumber.optional(),
  endLine: finiteNumber.optional(),
});

export type CardDocument = z.infer<typeof cardDocumentSchema>;

const cardUpdateDtoSchema = cardDocumentSchema
  .omit({ id: true, updatedAt: true })
  .partial()
  .extend({ updatedAt: finiteNumber });

export type CardUpdateDto = z.infer<typeof cardUpdateDtoSchema>;

/** Identifies malformed remote data without leaking a raw Zod error through application layers. */
export class FirestoreDocumentValidationError extends Error {
  readonly collection: "deck" | "card";
  readonly documentId: string;
  readonly issues: readonly z.core.$ZodIssue[];

  constructor(collection: "deck" | "card", documentId: string, error: z.ZodError) {
    const detail = error.issues
      .map((issue) => `${issue.path.length === 0 ? "document" : issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    super(`Invalid Firestore ${collection} document ${documentId}: ${detail}`);
    this.name = "FirestoreDocumentValidationError";
    this.collection = collection;
    this.documentId = documentId;
    this.issues = error.issues;
  }
}

const parseRemoteDocument = <Schema extends z.ZodType>(
  collection: "deck" | "card",
  id: string,
  schema: Schema,
  document: unknown
): z.output<Schema> => {
  const result = schema.safeParse(document);
  if (!result.success) throw new FirestoreDocumentValidationError(collection, id, result.error);
  return result.data;
};

/**
 * Converts deck document into the shape used by the next application layer.
 * The mapping keeps storage-specific representations out of domain and component code.
 */
export const mapDeckDocument = (id: DeckId, document: unknown): Deck => {
  const parsed = parseRemoteDocument("deck", id, deckDocumentSchema, document);
  const deck: Deck = {
    id,
    name: parsed.name,
    isPublic: parsed.isPublic,
    uid: parsed.uid,
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
    deletedAt: parsed.deletedAt,
    scoreMax: parsed.scoreMax,
    scoreMin: parsed.scoreMin,
    selectedTags: parsed.selectedTags,
    tagAndFilter: parsed.tagAndFilter,
    category: parsed.category,
    convertToBr: parsed.convertToBr,
  };
  if (parsed.url !== undefined) deck.url = parsed.url;
  return deck;
};

/**
 * Converts card document into the shape used by the next application layer.
 * The mapping keeps storage-specific representations out of domain and component code.
 */
export const mapCardDocument = (id: CardId, document: unknown): Card => {
  const parsed = parseRemoteDocument("card", id, cardDocumentSchema, document);
  const card: Card = {
    id,
    frontText: parsed.frontText,
    backText: parsed.backText,
    tags: parsed.tags,
    uniqueKey: parsed.uniqueKey,
    deckId: parsed.deckId,
    uid: parsed.uid,
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
    deletedAt: parsed.deletedAt,
    score: parsed.score,
    numberOfSeen: parsed.numberOfSeen,
  };
  if (parsed.lastSeenAt !== undefined) card.lastSeenAt = parsed.lastSeenAt;
  if (parsed.nextSeeingAt !== undefined) card.nextSeeingAt = parsed.nextSeeingAt;
  if (parsed.interval !== undefined) card.interval = parsed.interval;
  if (parsed.url !== undefined) card.url = parsed.url;
  if (parsed.startLine !== undefined) card.startLine = parsed.startLine;
  if (parsed.endLine !== undefined) card.endLine = parsed.endLine;
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
export const buildDeckCreateDto = (deck: Deck, createdAt: number): DeckDocument =>
  deckDocumentSchema.parse(
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

/** Builds the narrow Firestore patch used by auto-saving Deck filter controls. */
export const buildDeckFilterUpdateDto = (patch: DeckFilterPatch, updatedAt: number): DeckFilterUpdateDto =>
  deckFilterUpdateDtoSchema.parse({
    selectedTags: [...patch.selectedTags],
    tagAndFilter: patch.tagAndFilter,
    scoreMax: patch.scoreMax,
    scoreMin: patch.scoreMin,
    updatedAt,
  });

/**
 * Builds card create dto from the supplied application values.
 * The returned value is ready for the next layer, so callers do not need to repeat assembly or
 * defaulting rules.
 */
export const buildCardCreateDto = (card: Card, createdAt: number): CardDocument =>
  cardDocumentSchema.parse(
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
