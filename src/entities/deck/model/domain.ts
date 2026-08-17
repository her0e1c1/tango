import type { DeckId } from "./types";

declare const deckDomainBrand: unique symbol;

/** Canonical Deck business state used by pure Entity logic. */
type DeckDomainState = {
  /** Stable Deck identity. */
  id: DeckId;
  /** Current account owner, or `null` when the Deck is not account-owned. */
  ownerId: string | null;
  /** Human-readable Deck label. */
  name: string;
  /** Normalized source location; absence is represented only by `null`. */
  url: string | null;
  /** Whether the Deck is marked for public visibility. */
  isPublic: boolean;
  /** Inclusive upper Card-score boundary, or `null` when unrestricted. */
  scoreMax: number | null;
  /** Inclusive lower Card-score boundary, or `null` when unrestricted. */
  scoreMin: number | null;
  /** Card tags selected by the Deck filter. */
  selectedTags: readonly string[];
  /** Whether selected tags use AND rather than OR matching. */
  tagAndFilter: boolean;
  /** Fallback rendering category. */
  category: string;
  /** Whether imported line breaks are converted to HTML breaks. */
  convertToBr: boolean;
  /** Unix epoch time in milliseconds when the Deck was created. */
  createdAt: number;
  /** Unix epoch time in milliseconds when the Deck was last changed. */
  updatedAt: number;
};

/** Branded canonical Deck state that cannot be replaced by a structurally similar boundary type. */
export type DeckDomain = Readonly<DeckDomainState & { readonly [deckDomainBrand]: true }>;

/** Boundary data required to restore one canonical Deck domain value. */
type RestoreDeckDomainInput = Omit<DeckDomainState, "url" | "selectedTags"> & {
  url?: string | null;
  selectedTags: readonly string[];
};

/** Validated business data required to create one canonical Deck. */
type CreateDeckDomainInput = Omit<RestoreDeckDomainInput, "createdAt" | "updatedAt">;

/** Validated business changes accepted by the Deck domain transition. */
export type EditDeckDomainInput = {
  id: DeckId;
  name?: string;
  url?: string | null;
  isPublic?: boolean;
  scoreMax?: number | null;
  scoreMin?: number | null;
  selectedTags?: readonly string[];
  tagAndFilter?: boolean;
  category?: string;
  convertToBr?: boolean;
};

/** Restores and normalizes one Deck from a validated boundary representation. */
export const restoreDeckDomain = (input: RestoreDeckDomainInput): DeckDomain =>
  ({
    id: input.id,
    ownerId: input.ownerId,
    name: input.name,
    url: input.url ?? null,
    isPublic: input.isPublic,
    scoreMax: input.scoreMax,
    scoreMin: input.scoreMin,
    selectedTags: [...input.selectedTags],
    tagAndFilter: input.tagAndFilter,
    category: input.category,
    convertToBr: input.convertToBr,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  }) as unknown as DeckDomain;

/** Creates canonical Deck state with synchronized creation and update timestamps. */
export const createDeckDomain = (input: CreateDeckDomainInput, timestamp: number): DeckDomain =>
  restoreDeckDomain({ ...input, createdAt: timestamp, updatedAt: timestamp });

/** Applies a validated edit while preserving Deck identity, ownership, and creation time. */
export const editDeckDomain = (current: DeckDomain, edit: EditDeckDomainInput, updatedAt: number): DeckDomain => {
  if (current.id !== edit.id) throw new Error(`Deck edit id "${edit.id}" does not match "${current.id}"`);

  return restoreDeckDomain({
    ...current,
    ...(edit.name === undefined ? {} : { name: edit.name }),
    ...(edit.isPublic === undefined ? {} : { isPublic: edit.isPublic }),
    ...(edit.scoreMax === undefined ? {} : { scoreMax: edit.scoreMax }),
    ...(edit.scoreMin === undefined ? {} : { scoreMin: edit.scoreMin }),
    ...(edit.selectedTags === undefined ? {} : { selectedTags: edit.selectedTags }),
    ...(edit.tagAndFilter === undefined ? {} : { tagAndFilter: edit.tagAndFilter }),
    ...(edit.category === undefined ? {} : { category: edit.category }),
    ...(edit.convertToBr === undefined ? {} : { convertToBr: edit.convertToBr }),
    url: edit.url === undefined ? current.url : edit.url,
    updatedAt,
  });
};

/** Reports whether the authenticated actor owns the account-backed Deck. */
export const isDeckOwnedBy = (deck: DeckDomain, actorId: string): boolean =>
  deck.ownerId !== null && deck.ownerId === actorId;

/** Applies one Deck tag selection using its all-or-any matching mode. */
export const matchesDeckTagSelection = (
  candidateTags: readonly string[],
  selection: Pick<DeckDomainState, "selectedTags" | "tagAndFilter">
): boolean => {
  if (selection.selectedTags.length === 0) return true;
  if (selection.tagAndFilter) return selection.selectedTags.every((tag) => candidateTags.includes(tag));
  return selection.selectedTags.some((tag) => candidateTags.includes(tag));
};
