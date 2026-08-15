import type { z } from "zod";

import type {
  deckCreateSchema,
  deckEditSchema,
  deleteDeckSchema,
  editDeckSchema,
  localDeckCreateSchema,
} from "./schema";

export type Category = string;
export type DeckId = string;

/** Entity-internal Deck data without ownership, persistence, or presentation metadata. */
type DeckDomain = {
  /** Stable identity referenced by Cards, routes, study sessions, and persistence boundaries. */
  id: DeckId;
  /** Human-readable label shown wherever a Deck is selected or summarized. */
  name: string;
  /** Optional source location retained for Decks whose content originates from an external resource. */
  url?: string;
  /** Whether the Deck is marked for public visibility; local Decks normally keep this disabled. */
  isPublic: boolean;
  /** Inclusive upper Card-score boundary, or `null` when the Deck has no upper score restriction. */
  scoreMax: number | null;
  /** Inclusive lower Card-score boundary, or `null` when the Deck has no lower score restriction. */
  scoreMin: number | null;
  /** Card tags used by the Deck filter; an empty collection means that tags do not restrict Cards. */
  selectedTags: string[];
  /** Uses AND matching when true and OR matching when false for {@link selectedTags}. */
  tagAndFilter: boolean;
  /** Fallback rendering category when no supported Card tag supplies a more specific category. */
  category: Category;
  /** Whether imported text should convert two consecutive line breaks into one HTML `<br />`. */
  convertToBr: boolean;
  /** Unix epoch time in milliseconds when the Deck was created. */
  createdAt: number;
  /** Unix epoch time in milliseconds when the Deck was last changed. */
  updatedAt: number;
};

export type LocalDeck = DeckDomain & { localMode: true };
export type RemoteDeck = DeckDomain & { uid: string; localMode: false };
export type DeckStore = RemoteDeck | LocalDeck;
export type DeckView = DeckDomain & { localMode: boolean };
export type Deck = DeckView;
export type DeckCreate = z.infer<typeof deckCreateSchema>;
export type DeckCreateInput = z.input<typeof deckCreateSchema>;
export type LocalDeckCreateInput = z.input<typeof localDeckCreateSchema>;
export type DeckEdit = z.infer<typeof deckEditSchema>;
export type EditDeckInput = z.infer<typeof editDeckSchema>;
export type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;
