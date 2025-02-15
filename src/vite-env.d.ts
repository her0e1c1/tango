/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_PROJECT_ID: string;
  readonly VITE_WEB_API_KEY: string;
  readonly VITE_DB_HOST: string;
  readonly VITE_DB_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type Page = {
  top: "/";
  deckList: "/";
  config: "/settings";
  upload: "/import";
};

type PageKey = keyof Page;

type DeckId = string;
type CardId = string;

type LayoutProps = {
  showHeader?: boolean;
  fixedHeader?: boolean;
  scroll?: boolean;
  fullscreen?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  headerProps?: HeaderProps;
};

interface HeaderProps {
  dark?: boolean;
  onClickLogo?: () => void;
  onClickDarkMode?: (b: boolean) => void;
  onClickMenuItem?: (key: PageKey) => void;
}

interface FrontTextProps {
  text: string;
  category?: string;
  onSwipeLeft?: () => void;
  onSwipeUp?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onClick?: () => void;
}

interface BackTextProps {
  text: string;
  category?: string;
  onClick?: () => void;
}

interface SwipeButtonListProps {
  onClickUp?: () => void;
  onClickDown?: () => void;
  onClickLeft?: () => void;
  onClickRight?: () => void;
}

interface ControllerProps {
  autoPlay?: boolean;
  index?: number;
  cardInterval?: number;
  numberOfCards?: number;
  onChange?: (index: number) => void;
}

interface DeckActionsProps {
  onClickName?: (id: string) => void;
  onClickStudy?: (id: string) => void;
  onClickRestart?: (id: string) => void;
  onClickDownload?: (id: string) => void;
  onClickEdit?: (id: string) => void;
  onClickDelete?: (id: string) => void;
  onClickReimport?: (id: string) => void;
}

type CardProps = CardActionsProps;

interface CardActionsProps {
  onSwipedLeft?: (id: string) => void;
  onSwipedRight?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  goToEdit?: (id: string) => void;
  goToView?: (id: string) => void;
}

type CardListProps = { cards: Card[] } & CardActionsProps;

type DeckCardProps = { deck?: Deck } & DeckActionsProps;

type DeckListProps = { decks: Deck[] } & DeckActionsProps;

interface DeckFormProps {
  deck: Deck;
  categoryOptions?: Option[];
  onSubmit?: (deck: Deck) => void;
  schema?: any;
}

interface DeckStartFormProps {
  deck: Deck;
  tags: string[];
  schema?: any;
  onSubmit?: (values: Deck) => void;
}

interface CardFormProps {
  card?: Card;
  categoryOptions?: Option[];
  onSubmit?: (card: Card) => void;
  schema?: any;
}

interface ConfigFormProps {
  isLoggedIn?: boolean;
  config: ConfigState;
  onSubmit?: (config: ConfigState) => void;
  onLogin?: () => void;
  onLogout?: () => void;
  schema?: any;
  version?: string;
}

interface Option {
  label: string;
  value: string;
}

interface Action<P = any> {
  type: string;
  payload: P;
  error?: { message: string };
}

type New<T> = Omit<T, "id">;
type Edit<T> = Partial<T> & Pick<T, "id">;

type Callback = () => void;
type Callback1<T> = (arg: T) => void;

type Category = string;

interface Deck {
  // user input
  name: string;
  url?: string;
  isPublic: boolean;

  // metadata
  id: string;
  uid: string; // empty if imported publick deck
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null; // soft delete flag

  // if true, not stored in firestore
  // but in redux state only
  localMode: boolean;

  // when user selects a deck, show this index card
  // this should not be stored in sqlite
  currentIndex: number | null;

  scoreMax: number | null;
  scoreMin: number | null;

  // used for deck swiper
  cardOrderIds: string[];
  // better to store firebase
  // because you want to keep the same condition after studying
  selectedTags: string[];
  tagAndFilter: boolean; // if false, it's OR filter

  category: Category;
  convertToBr: boolean;
}

type DeckConfig = Pick<ConfigState, "uid" | "localMode">;
type DeckRaw = Pick<Deck, "name">;
type DeckNew = New<Deck>;
type DeckEdit = Edit<Deck>;

interface Card {
  // user input
  frontText: string;
  backText: string;
  tags: string[];

  // key which user manage by himself
  uniqueKey: string;

  // meta
  id: string;
  deckId: string;
  uid: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;

  // for learning
  score: number;
  numberOfSeen: number;
  lastSeenAt?: number;
  nextSeeingAt?: Date;
  interval?: number; // minute

  // fetch data from web
  url?: string;
  startLine?: number;
  endLine?: number;
}

type CardDeck = Pick<Deck, "id" | "uid" | "localMode">;
type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
type CardNew = New<Card>;
type CardEdit = Edit<Card> & { deckId: string };

type CardTextKey = "frontText" | "backText" | "hint";

interface DeckState {
  byId: Record<string, Deck | undefined>;
  categories: string[];
}

interface CardState {
  byId: Record<string, Card | undefined>;
  tags: string[];
}

interface SwipeState {
  cardSwipeUp: cardSwipe;
  cardSwipeDown: cardSwipe;
  cardSwipeLeft: cardSwipe;
  cardSwipeRight: cardSwipe;
}

type SwipeDirection = keyof SwipeState;

type cardSwipe =
  | "DoNothing"
  | "GoBack"
  | "GoToPrevCard"
  | "GoToNextCard"
  | "GoToNextCardMastered"
  | "GoToNextCardNotMastered"
  | "GoToNextCardToggleMastered";

type ConfigState = SwipeState & {
  lastSwipe?: SwipeDirection;
  useCardInterval: boolean;
  showSwipeButtonList: boolean;
  showScoreSlider: boolean;
  showHeader: boolean;
  fullscreen: boolean;
  shuffled: boolean;
  showBackText: boolean;
  sizeBackText: number;
  maxNumberOfCardsToLearn: number;
  hideBodyWhenCardChanged: boolean;
  showSwipeFeedback: boolean;
  keepBackTextViewed: boolean;
  autoPlay: boolean;
  defaultAutoPlay: boolean;
  cardInterval: number;
  darkMode: boolean;
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  selectedTags: string[];
  // seems like redux changes a date object
  lastUpdatedAt: number; // Date;
  githubAccessToken: string;
  loadSample: boolean;
  localMode: boolean;
};

interface RootState {
  deck: DeckState;
  card: CardState;
  config: ConfigState;
}

type Select0<O> = () => (state: RootState) => O;

type Select<I, O> = (props: I) => (state: RootState) => O;

interface DeckEvent {
  added: Deck[];
  modified: Deck[];
  removed: string[];
  lastUpdatedAt?: number;
  metadata: { size: number; fromLocal: boolean }; // in terms of firestore test, `fromCache` is unstable
}

interface CardEvent {
  added: Card[];
  modified: Card[];
  removed: string[];
  lastUpdatedAt?: number;
  metadata: { size: number; fromLocal: boolean };
}
