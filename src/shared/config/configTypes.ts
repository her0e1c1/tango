export type SwipeAction =
  | "DoNothing"
  | "GoBack"
  | "GoToPrevCard"
  | "GoToNextCard"
  | "GoToNextCardMastered"
  | "GoToNextCardNotMastered"
  | "GoToNextCardToggleMastered";

export interface SwipeState {
  cardSwipeUp: SwipeAction;
  cardSwipeDown: SwipeAction;
  cardSwipeLeft: SwipeAction;
  cardSwipeRight: SwipeAction;
}

export type SwipeDirection = keyof SwipeState;

export interface AppearancePreferences {
  darkMode: boolean;
  showHeader: boolean;
  fullscreen: boolean;
  sizeBackText: number;
  hideBodyWhenCardChanged: boolean;
  showSwipeFeedback: boolean;
}

export interface StudyPreferences {
  maxNumberOfCardsToLearn: number;
  shuffled: boolean;
  useCardInterval: boolean;
  cardInterval: number;
  keepBackTextViewed: boolean;
  defaultAutoPlay: boolean;
  selectedTags: string[];
}

export interface ControlPreferences extends SwipeState {
  showSwipeButtonList: boolean;
  showScoreSlider: boolean;
}

export interface ConfigState {
  appearance: AppearancePreferences;
  study: StudyPreferences;
  controls: ControlPreferences;
}
