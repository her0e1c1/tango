import type { z } from "zod";

import type { deckCreateSchema, deckIdSchema, localDeckCreateSchema } from "./schema";

/** Deck rendering category or syntax-highlighting language. */
export type Category = string;
/** Stable identifier shared by Deck boundaries and dependent Entities. */
export type DeckId = z.infer<typeof deckIdSchema>;

/** Persisted identity that orders and resumes one local-to-remote migration attempt. */
export interface DeckMigration {
  id: string;
  revision: number;
}

/** Deck data used throughout the application, including the fields needed by its persistence mode. */
export type Deck = {
  /** Stable identity referenced by Cards, routes, study sessions, and persistence boundaries. */
  id: DeckId;
  /** Human-readable label shown wherever a Deck is selected or summarized. */
  name: string;
  /** Optional source location retained for Decks whose content originates from an external resource. */
  url?: string | undefined;
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
  /** Present while a local migration is resumable and on remote data created by that migration. */
  migration?: DeckMigration | undefined;
} & ({ localMode: true; localRevision: number } | { uid: string; localMode: false });

/** Input accepted at the remote Deck creation boundary. */
export type DeckCreateInput = z.input<typeof deckCreateSchema>;
/** Input accepted at the local Deck creation boundary. */
export type LocalDeckCreateInput = z.input<typeof localDeckCreateSchema>;
