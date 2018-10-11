type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

interface Action<P = undefined> {
  type: string;
  payload: P;
}

type Category = string; // 'math' | 'python' | 'golang' | 'haskell' | 'raw' | 'markdown';

interface Deck {
  id: string;
  name: string;
  isPublic: boolean;
  url: string | null;
  updatedAt: Date;
  createdAt: Date;
  deletedAt?: Date; // soft delete flag
  uid: string;

  // the order which user defines.
  // this should not be shuffled
  // because cards in a deck should be reordered,
  // card interface should not have a order column.
  // it's hard to change the order.
  // so it needs to define in deck
  cardIds: string[];

  // when user selects a deck, show this index card
  // this should not be stored in sqlite
  currentIndex: number;
  category?: Category;
  convertToBr?: boolean;

  // google spread sheet
  spreadsheetId: string | null;
  spreadsheetGid: string | null;
}

interface Sheet {
  properties: {
    sheetId: number; // GID
    title: string;
  };
}

interface Card {
  id: string;
  frontText: string;
  backText: string;
  hint: string;
  mastered: boolean;
  deckId: string;
  uid: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
type CardTextKey = 'frontText' | 'backText' | 'hint';

type DeckState = {
  byId: { [key: string]: Deck };
  edit: Deck;
  categories: string[];
};

type CardState = {
  byId: { [key: string]: Card };
  byDeckId: { [key: string]: string[] };
  tags: string[];
  edit: Card;
};

type NavState = {
  routes?: NavState[];
  index: number;
  key: string;
  routeName: string;
  params?: any;
};

type themeType = 'default' | 'dark' | 'debug';

interface Theme {
  mainBackgroundColor: string;
  mainColor: string;
  titleColor: string;
  masteredColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  circleBackgroundColor: string;
  bgTextInput: string;
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
  showHint: boolean;
  hideBodyWhenCardChanged: boolean;
  cardInterval: number;
  theme: themeType;
  isLoading: boolean;
  errorCode?: errorCode;
  cardSwipeUp: cardSwipe;
  cardSwipeDown: cardSwipe;
  cardSwipeLeft: cardSwipe;
  cardSwipeRight: cardSwipe;
  googleAccessToken?: string;
  uid: string;
  displayName: string | null;
  selectedTags: string[];
  // seems like redux changes a date object
  lastUpdatedAt: number; // Date;
};

interface RootState {
  deck: DeckState;
  card: CardState;
  nav: NavState;
  config: ConfigState;
}

interface AppContext {
  theme: Theme;
}

type _ThunkAction<R, S, E, A extends Action> = (
  dispatch: ThunkDispatch<S, E, A>,
  getState: () => S,
  extraArgument: E
) => R;

type ThunkAction<R = void> = _ThunkAction<R, RootState, undefined, Action>;

interface Dispatch<S, E, A extends Action> {
  <T extends A>(action: T): T;
  <R>(asyncAction: _ThunkAction<R, S, E, A>): R;
}

interface ConnectedProps {
  state: RootState;

  // this doesn't work
  // dispatch: Dispatch<RootState>;
  // but this code works
  // import { Dispatch } from 'redux'
  dispatch: any;
}

// Because there is a conflict between @types/react-native and lib: ["dom"] in tsconfig.json,
// react-native doesn't include alert so it must be defined manually
interface ReactNativeAlert {
  (string): void;
}
declare const alert: ReactNativeAlert;
