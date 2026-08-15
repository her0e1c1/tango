import type { z } from "zod";

import type {
  deckCreateSchema,
  deckEditSchema,
  deckIdSchema,
  deckSchema,
  deleteDeckSchema,
  editDeckSchema,
  localDeckCreateSchema,
  localDeckSchema,
  remoteDeckSchema,
} from "./schema";

export type Category = string;
export type Deck = z.infer<typeof deckSchema>;
export type DeckCreate = z.infer<typeof deckCreateSchema>;
export type DeckCreateInput = z.input<typeof deckCreateSchema>;
export type LocalDeckCreateInput = z.input<typeof localDeckCreateSchema>;
export type LocalDeck = z.infer<typeof localDeckSchema>;
export type RemoteDeck = z.infer<typeof remoteDeckSchema>;
export type DeckId = z.infer<typeof deckIdSchema>;
export type DeckEdit = z.infer<typeof deckEditSchema>;
export type EditDeckInput = z.infer<typeof editDeckSchema>;
export type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;
