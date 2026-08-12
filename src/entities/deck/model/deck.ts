import type { Category } from "./category";

export type DeckId = string;

export interface Deck {
  name: string;
  url?: string;
  isPublic: boolean;
  id: DeckId;
  uid: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  category: Category;
  convertToBr: boolean;
}

export type DeckRaw = Pick<Deck, "name">;
export type DeckNew = Omit<Deck, "id">;
export type DeckEdit = Partial<Deck> & Pick<Deck, "id">;

export const createDeck = (deck: DeckRaw, uid: string, generateId: () => string): Deck => ({
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
