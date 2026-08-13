import type { Deck as DeckModel } from "./schema";

export type { Deck } from "./schema";

export type DeckRaw = Pick<DeckModel, "name">;

export const createDeck = (deck: DeckRaw, uid: string, generateId: () => string): DeckModel => ({
  ...deck,
  uid,
  id: generateId(),
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  scoreMax: null,
  scoreMin: null,
  isPublic: false,
  selectedTags: [],
  tagAndFilter: false,
  convertToBr: false,
  category: "",
});
