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
  mastered: boolean;
  tags: Tag[];
}

type DeckState = { [key: string]: Deck };
type CardState = { byId: {[key: string]: Card}, byDeckId: {[key: string]: number[]} };
type NavState = { deck?: Deck; card?: Card; index?: number };

interface RootState {
  deck: DeckState;
  card: CardState;
  nav: NavState;
}

type Callback = () => void;
