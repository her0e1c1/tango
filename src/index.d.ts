type DeckType = 'drive' | 'firebase' | 'url';
type DriveType = 'application/vnd.google-apps.spreadsheet';

interface Deck {
  id: number;
  fkid?: string; // id for firebase or spreadsheet
  type?: DeckType;
  name: string;
  url?: string;
  isPublic: boolean;
}

interface Drive {
  id: string;
  title: string;
  alternateLink: string;
  mimeType: DriveType;
  modifiedDate: string;
  createdDate: string;
  labels: {
    trashed: boolean;
  };
}

interface Tag {
  name: string;
}

interface Card {
  id: number;
  fkid: string;
  name: string;
  body: string;
  hint: string;
  mastered: boolean;
  deck_id: number;
  deck: Deck;
  category: string;
  tags: Tag[];
}

type DeckState = { byId: { [key: string]: Deck } };

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
  masteredColor: string;
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
  googleAccessToken?: string;
  googleRefreshToken?: string;
};

interface ShareState {
  user: {
    [uid: string]: {
      deck: { byId: { [key: string]: Deck } };
      card: { byId: { [key: string]: Card } };
    };
  };
}

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
  share: ShareState;
  user: UserState;
  drive: DriveState;
}

type Callback = () => void;

interface AppContext {
  theme: Theme;
}
