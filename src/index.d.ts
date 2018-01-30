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
  hint: string;
  mastered: boolean;
  deck_id: number;
  tags: Tag[];
}

type DeckState = { [key: string]: Deck };

type CardState = {
  byId: { [key: string]: Card };
  byDeckId: { [key: string]: number[] };
};

type NavState = { deck?: Deck; card?: Card; index?: number };

type themeType = 'default' | 'dark' | 'debug';

interface Theme {
  mainBackgroundColor: string;
  mainColor: string;
  titleColor: string;
  cardBackgroundColor: string;
  circleBackgroundColor: string;
}

type ConfigState = {
  showMastered: boolean;
  showHeader: boolean;
  shuffled: boolean;
  start: number;
  theme: themeType;
};

interface RootState {
  deck: DeckState;
  card: CardState;
  nav: NavState;
  config: ConfigState;
}

type Callback = () => void;

interface AppContext {
  theme: Theme;
}
