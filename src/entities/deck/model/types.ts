import type { z } from "zod";

import type {
  deckCreateSchema,
  deckEditSchema,
  deckIdSchema,
  editDeckSchema,
  localDeckCreateSchema,
  localDeckSchema,
} from "./schema";

/** Deck rendering category or syntax-highlighting language. */
export type Category = string;
/** Stable identifier shared by Deck boundaries and dependent Entities. */
export type DeckId = z.infer<typeof deckIdSchema>;

/** Fields retained by one internal Deck store record. */
type DeckRecordFields = {
  /** Stable Deck identity used by Cards, routes, and study sessions. */
  id: DeckId;
  /** Human-readable Deck label. */
  name: string;
  /** Optional source location retained by imported Decks. */
  url?: string;
  /** Whether the Deck is marked for public visibility. */
  isPublic: boolean;
  /** Inclusive upper Card-score boundary, or `null` when unrestricted. */
  scoreMax: number | null;
  /** Inclusive lower Card-score boundary, or `null` when unrestricted. */
  scoreMin: number | null;
  /** Card tags selected by the Deck filter. */
  selectedTags: string[];
  /** Whether selected tags use AND rather than OR matching. */
  tagAndFilter: boolean;
  /** Fallback rendering category. */
  category: Category;
  /** Whether imported line breaks are converted to HTML breaks. */
  convertToBr: boolean;
  /** Unix epoch time in milliseconds when the Deck was created. */
  createdAt: number;
  /** Unix epoch time in milliseconds when the Deck was last changed. */
  updatedAt: number;
};

/** Browser-persisted Deck record without account ownership metadata. */
export type LocalDeck = DeckRecordFields & { localMode: true };
/** Firestore-backed Deck record with its persisted owner identifier. */
export type RemoteDeck = DeckRecordFields & { uid: string; localMode: false };
/** Internal Deck store record spanning both persistence modes. */
export type DeckStore = RemoteDeck | LocalDeck;
/** Validated browser-persisted Deck record before domain normalization. */
export type PersistedLocalDeck = z.infer<typeof localDeckSchema>;
/** Canonical browser-persisted Deck state after boundary validation. */
export interface PersistedDeckState {
  localDecks: LocalDeck[];
}

/** Public persistence-neutral Deck read model exposed to Features. */
export type Deck = {
  id: DeckId;
  name: string;
  url?: string;
  isPublic: boolean;
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  category: Category;
  convertToBr: boolean;
  createdAt: number;
  updatedAt: number;
  localMode: boolean;
};

/** Validated Deck creation command after defaults are applied. */
export type DeckCreate = z.infer<typeof deckCreateSchema>;
/** Public Deck creation command accepted by the Entity boundary. */
export type DeckCreateInput = z.input<typeof deckCreateSchema>;
/** Local-only Deck creation command used by the internal store boundary. */
export type LocalDeckCreateInput = z.input<typeof localDeckCreateSchema>;
/** Validated partial edit for a Deck. */
export type DeckEdit = z.infer<typeof deckEditSchema>;
/** Validated authenticated Deck edit request. */
export type EditDeckInput = z.infer<typeof editDeckSchema>;
