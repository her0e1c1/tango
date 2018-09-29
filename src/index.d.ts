interface Action<P = undefined> {
  type: string;
  payload: P;
}

type Category = 'math' | 'python' | 'golang' | 'haskell' | 'raw' | 'markdown';

interface Deck {
  id: string;
  name: string;
  isPublic: boolean;
  url?: string;
  spreadsheetId?: string;
  spreadsheetGid?: string;

  // when user selects a deck, show this index card
  // this should not be stored in sqlite
  currentIndex: number;
  category?: Category;
  convertToBr?: boolean;
}

// TODO: use ts 2.8
// after fix this https://github.com/DefinitelyTyped/DefinitelyTyped/issues/24573
type DeckInsert = Pick<
  Deck,
  'name' | 'url' | 'spreadsheetId' | 'spreadsheetGid'
>;
type DeckUpdate = DeckInsert & Pick<Deck, 'id' | 'isPublic'>;
type DeckSelect = DeckUpdate | undefined;

interface Sheet {
  properties: {
    sheetId: number; // GID
    title: string;
  };
}

interface Card {
  id: string;
  fkid: string; // TODO: remove
  frontText: string;
  backText: string;
  hint: string;
  mastered: boolean;
  deckId: number;
  // firebase can not store undefined ...
  category: string | null;
}

type DeckState = { byId: { [key: string]: Deck }; edit: Deck };

type CardState = {
  byId: { [key: string]: Card };
  byDeckId: { [key: string]: string[] };
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
  start: number;
  theme: themeType;
  isLoading: boolean;
  errorCode?: errorCode;
  cardSwipeUp: cardSwipe;
  cardSwipeDown: cardSwipe;
  cardSwipeLeft: cardSwipe;
  cardSwipeRight: cardSwipe;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  uid?: string;
};

interface UserState {
  uid: string;
  displayName: string | null;
}

interface DriveState {
  byId: { [key: string]: Drive };
}

interface RootState {
  deck: DeckState;
  card: CardState;
  nav: NavState;
  config: ConfigState;
}

interface AppContext {
  theme: Theme;
}

type _ThunkAction<R, S, E> = (
  dispatch: Dispatch<S>,
  getState: () => S,
  extraArgument: E
) => R;

type ThunkAction<T = void> = _ThunkAction<T, RootState, undefined, Action>;

interface Dispatch<S> {
  <R, E>(asyncAction: _ThunkAction<R, S, E>): R;
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
