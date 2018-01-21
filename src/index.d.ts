interface Deck {
  id: number;
  name: string;
  cards: Card[];
  url?: string;
}

interface Tag {
  name: string;
}

interface Card {
  id: number;
  name: string;
  body: string;
  deck_id: number;
  tags: Tag[];
}

type DeckState = { [key: string]: Deck };
interface RootState {
  deck: DeckState;
}
