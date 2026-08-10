import type { ConfigState } from "./config";

export const createConfig = (overrides: Partial<ConfigState> = {}): ConfigState => ({
  useCardInterval: false,
  showSwipeButtonList: true,
  showScoreSlider: false,
  showHeader: true,
  fullscreen: false,
  shuffled: false,
  sizeBackText: 0,
  maxNumberOfCardsToLearn: 10,
  hideBodyWhenCardChanged: true,
  showSwipeFeedback: false,
  keepBackTextViewed: false,
  defaultAutoPlay: false,
  cardInterval: 60,
  cardSwipeUp: "GoToNextCardMastered",
  cardSwipeDown: "GoToNextCardNotMastered",
  cardSwipeLeft: "GoToPrevCard",
  cardSwipeRight: "GoToNextCard",
  darkMode: false,
  selectedTags: [],
  ...overrides,
});
