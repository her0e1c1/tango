export type CardSwipeAction =
  | "DoNothing"
  | "GoBack"
  | "GoToPrevCard"
  | "GoToNextCard"
  | "GoToNextCardMastered"
  | "GoToNextCardNotMastered"
  | "GoToNextCardToggleMastered";

interface SwipeState {
  cardSwipeUp: CardSwipeAction;
  cardSwipeDown: CardSwipeAction;
  cardSwipeLeft: CardSwipeAction;
  cardSwipeRight: CardSwipeAction;
}

export type SwipeDirection = keyof SwipeState;

export interface ConfigState extends SwipeState {
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
}
