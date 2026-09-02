import type { z } from "zod";

import type { Difficulty } from "@/entities/study-progress/@x/deck";
import type { deckCreateSchema, deckIdSchema, localDeckCreateSchema } from "./schema";

/** Deck rendering category or syntax-highlighting language. */
export type Category = string;
/** Stable identifier shared by Deck boundaries and dependent Entities. */
export type DeckId = z.infer<typeof deckIdSchema>;

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
  /** Inclusive upper Card-difficulty boundary, or `null` when the Deck has no upper difficulty restriction. */
  difficultyMax: Difficulty | null;
  /** Inclusive lower Card-difficulty boundary, or `null` when the Deck has no lower difficulty restriction. */
  difficultyMin: Difficulty | null;
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
} & ({ localMode: true } | { uid: string; localMode: false });

/** Owner-free input accepted at the remote Deck creation boundary. */
export type RemoteDeckCreateInput = z.input<typeof deckCreateSchema>;
/** Input accepted at the local Deck creation boundary. */
export type LocalDeckCreateInput = z.input<typeof localDeckCreateSchema>;
