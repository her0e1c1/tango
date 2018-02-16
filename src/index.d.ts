interface Deck {
  id: number;
  name: string;
  cards: Card[];
  url?: string;
  isPublic: boolean;
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

interface Route {
  key: string;
  routeName: string;
  params?: any;
}
type NavState = { index: number; routes: Route[] };

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
  cardIndex: number;
  cardSwipeUp: cardSwipe;
  cardSwipeDown: cardSwipe;
  cardSwipeLeft: cardSwipe;
  cardSwipeRight: cardSwipe;
};

interface UserState {
  uid: string;
  displayName: string | null;
}

interface RootState {
  deck: DeckState;
  card: CardState;
  nav: NavState;
  config: ConfigState;
  user: UserState;
}

type Callback = () => void;

interface AppContext {
  theme: Theme;
}
