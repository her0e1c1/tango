import type { Deck } from "./deck";

export const prepareDeck = (deck: Pick<Deck, "name">, uid: string, generateId: () => string): Deck => ({
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
