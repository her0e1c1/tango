import type { z } from "zod";

import type {
  deckCreateSchema,
  deckEditSchema,
  deckIdSchema,
  deleteDeckSchema,
  editDeckSchema,
  localDeckCreateSchema,
} from "./schema";

/** Deck rendering category or syntax-highlighting language. */
export type Category = string;
/** Stable identifier shared by Deck boundaries and dependent Entities. */
export type DeckId = z.infer<typeof deckIdSchema>;

/** Entity-internal Deck data without ownership, persistence, or presentation metadata. */
export type DeckDomain = {
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

/** Runtime controls for evaluating whether a Card is currently eligible for study in a Deck. */
export interface StudyCardEligibilityOptions {
  useCardInterval: boolean;
  now: number;
}

/** Browser-persisted Deck variant without remote ownership metadata. */
export type LocalDeck = DeckDomain & { localMode: true };
/** Firestore-backed Deck variant with authenticated ownership metadata. */
export type RemoteDeck = DeckDomain & { uid: string; localMode: false };
/** Entity store read model spanning both Deck persistence modes. */
export type DeckStore = RemoteDeck | LocalDeck;
/** Canonical browser-persisted Deck state after boundary data is mapped into store types. */
export interface PersistedDeckState {
  localDecks: LocalDeck[];
}
/** Public Deck view that exposes persistence mode without ownership metadata. */
export type DeckView = DeckDomain & { localMode: boolean };
/** Public Deck read model exposed outside the Entity. */
export type Deck = DeckView;
/** Validated payload used to create a remote Deck document. */
export type DeckCreate = z.infer<typeof deckCreateSchema>;
/** Input accepted at the remote Deck creation boundary. */
export type DeckCreateInput = z.input<typeof deckCreateSchema>;
/** Input accepted at the local Deck creation boundary. */
export type LocalDeckCreateInput = z.input<typeof localDeckCreateSchema>;
/** Validated partial edit for a Deck. */
export type DeckEdit = z.infer<typeof deckEditSchema>;
/** Validated authenticated Deck edit command. */
export type EditDeckInput = z.infer<typeof editDeckSchema>;
/** Validated authenticated Deck delete command. */
export type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;
