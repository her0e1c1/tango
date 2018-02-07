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
  deck: Deck;
  category: string;
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
  cardBorderColor: string;
  circleBackgroundColor: string;
}

type errorCode = 'INVALID_URL' | 'CAN_NOT_FETCH' | 'NO_CARDS';
type cardSwipe =
  | 'goBack'
  | 'goToPrevCard'
  | 'goToNextCard'
  | 'goToNextCardMastered'
  | 'goToNextCardNotMastered'
  | 'goToNextCardToggleMastered';

type ConfigState = {
  showMastered: boolean;
  showHeader: boolean;
  shuffled: boolean;
  showBody: boolean;
  hideBodyWhenCardChanged: boolean;
  start: number;
  theme: themeType;
  isLoading: boolean;
  errorCode?: errorCode;
  cardSwipeUp: cardSwipe;
  cardSwipeDown: cardSwipe;
  cardSwipeLeft: cardSwipe;
  cardSwipeRight: cardSwipe;
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
