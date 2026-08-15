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
