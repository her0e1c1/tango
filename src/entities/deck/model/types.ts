import type { z } from "zod";

import type {
  deckCreateSchema,
  deckDomainSchema,
  deckEditSchema,
  deckIdSchema,
  deckStoreSchema,
  deleteDeckSchema,
  editDeckSchema,
  localDeckCreateSchema,
  localDeckSchema,
  remoteDeckSchema,
} from "./schema";

export type Category = string;

/** Storage-neutral Deck data shared by every application boundary. */
export type DeckDomain = z.infer<typeof deckDomainSchema>;
export type LocalDeck = z.infer<typeof localDeckSchema>;
export type RemoteDeck = z.infer<typeof remoteDeckSchema>;
export type DeckStore = z.infer<typeof deckStoreSchema>;
export type DeckView = DeckDomain & Pick<DeckStore, "localMode">;
export type Deck = DeckView;
export type DeckCreate = z.infer<typeof deckCreateSchema>;
export type DeckCreateInput = z.input<typeof deckCreateSchema>;
export type LocalDeckCreateInput = z.input<typeof localDeckCreateSchema>;
export type DeckId = z.infer<typeof deckIdSchema>;
export type DeckEdit = z.infer<typeof deckEditSchema>;
export type EditDeckInput = z.infer<typeof editDeckSchema>;
export type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;
