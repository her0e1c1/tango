export type DeckId = string;

type Category = string;
export type DeckEdit = Partial<Deck> & Pick<Deck, "id">;

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
