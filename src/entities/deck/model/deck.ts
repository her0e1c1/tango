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
  category: string;
  convertToBr: boolean;
}
