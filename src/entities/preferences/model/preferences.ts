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

export interface Preferences {
  appearance: AppearancePreferences;
  study: StudyPreferences;
  controls: ControlPreferences;
}

export const defaultPreferences: Preferences = Object.freeze({
  appearance: Object.freeze({
    darkMode: false,
    showHeader: true,
    fullscreen: false,
    sizeBackText: 0,
    hideBodyWhenCardChanged: true,
    showSwipeFeedback: false,
  }),
  study: Object.freeze({
    maxNumberOfCardsToLearn: 10,
    shuffled: false,
    useCardInterval: false,
    cardInterval: 60,
    keepBackTextViewed: false,
    defaultAutoPlay: false,
    selectedTags: Object.freeze([]) as unknown as string[],
  }),
  controls: Object.freeze({
    showSwipeButtonList: true,
    showScoreSlider: false,
    cardSwipeUp: "GoToNextCardMastered",
    cardSwipeDown: "GoToNextCardNotMastered",
    cardSwipeLeft: "GoToPrevCard",
    cardSwipeRight: "GoToNextCard",
  }),
});
