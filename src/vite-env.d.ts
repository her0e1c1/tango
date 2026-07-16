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

interface Action<P = unknown> {
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

  scoreMax: number | null;
  scoreMin: number | null;

  // better to store firebase
  // because you want to keep the same condition after studying
  selectedTags: string[];
  tagAndFilter: boolean; // if false, it's OR filter

  category: Category;
  convertToBr: boolean;
}

type DeckConfig = { uid: string; localMode: boolean };
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
  useCardInterval: boolean;
  showSwipeButtonList: boolean;
  showScoreSlider: boolean;
  showHeader: boolean;
  fullscreen: boolean;
  shuffled: boolean;
  sizeBackText: number;
  maxNumberOfCardsToLearn: number;
  hideBodyWhenCardChanged: boolean;
  showSwipeFeedback: boolean;
  keepBackTextViewed: boolean;
  defaultAutoPlay: boolean;
  cardInterval: number;
  darkMode: boolean;
  selectedTags: string[];
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
