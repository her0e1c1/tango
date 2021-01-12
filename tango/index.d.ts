type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

interface Action<P = any> {
  type: string;
  payload: P;
  error?: { message: string };
}

type Update<T> = Partial<T> & Pick<T, 'id'>;
type Edit<T> = Partial<T>;

type Callback = () => void;
type Callback1<T> = (arg: T) => void;

type Category = string; // 'math' | 'python' | 'golang' | 'haskell' | 'raw' | 'markdown';

interface Deck {
  id: string;
  name: string;
  isPublic: boolean;
  url?: string;
  sheetId?: string;
  updatedAt: Date;
  createdAt: Date;
  deletedAt?: Date; // soft delete flag
  uid: string; // empty if imported publick deck

  // the order which user defines.
  // this should not be shuffled
  // because cards in a deck should be reordered,
  // card interface should not have a order column.
  // it's hard to change the order.
  // so it needs to define in deck
  cardIds: string[];
  // used for deck swiper
  cardOrderIds: string[];

  // when user selects a deck, show this index card
  // this should not be stored in sqlite
  currentIndex: number;
  selectedTags: string[];
  scoreMax: number | null;
  scoreMin: number | null;

  category: Category;
  convertToBr: boolean;
  onlyBodyinWebview: boolean;
}

interface DeckModel extends Deck {
  toJSON(deck: Partial<Deck>): Deck;
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
  mastered: boolean;
  score: number;
  deckId: string;
  uid: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

  numberOfSeen: number;
  lastSeenAt?: Date;
  nextSeeingAt: Date;
  interval: number; // minute

  // fetch data from web
  url?: string;
  startLine?: number;
  endLine?: number;
}

interface Sheet {
  // for sheet
  id: string; // spreadSheetId::index
  index: string;
  title: string;

  // for spread sheet
  spreadSheetId: string;
  name: string;
}

type CardTextKey = 'frontText' | 'backText' | 'hint';

type DeckState = {
  byId: { [key: string]: Deck };
  edit: Deck;
  categories: string[];
};

type CardState = {
  byId: { [key: string]: Card };
  tags: string[];
  edit: Card;
};

type DownloadState = {
  sheetById: { [key: string]: Sheet };
  publicDecks: Deck[];
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

interface SwipeState {
  cardSwipeUp: cardSwipe;
  cardSwipeDown: cardSwipe;
  cardSwipeLeft: cardSwipe;
  cardSwipeRight: cardSwipe;
}

type SwipeDirection = keyof SwipeState;

type cardSwipe =
  | 'DoNothing'
  | 'GoBack'
  | 'GoToPrevCard'
  | 'GoToNextCard'
  | 'GoToNextCardMastered'
  | 'GoToNextCardNotMastered'
  | 'GoToNextCardToggleMastered';

type ConfigState = SwipeState & {
  lastSwipe?: SwipeDirection;
  useCardInterval: boolean;
  showSwipeButtonList: boolean;
  showMastered: boolean;
  showHeader: boolean;
  shuffled: boolean;
  showBackText: boolean;
  maxNumberOfCardsToLearn: number;
  hideBodyWhenCardChanged: boolean;
  keepBackTextViewed: boolean;
  autoPlay: boolean;
  defaultAutoPlay: boolean;
  cardInterval: number;
  isLoading: boolean;
  isLoadingNoAction: boolean;
  loadingCount: number;
  googleAccessToken: string;
  googleRefreshToken: string;
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
  download: DownloadState;
}

// Because there is a conflict between @types/react-native and lib: ["dom"] in tsconfig.json,
// react-native doesn't include alert so it must be defined manually
interface ReactNativeAlert {
  (string): void;
}
declare const alert: ReactNativeAlert;
declare const __REDIRECT_URI__: string;
