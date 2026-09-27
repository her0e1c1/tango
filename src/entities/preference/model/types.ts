/** Action assigned to a Card swipe gesture. */
export type SwipeAction = "DoNothing" | "GoBack" | "GoToNextCard" | "RateGood" | "RateAgain" | "RateHard" | "RateEasy";
/** System language selection or an explicit supported locale. */
export type LanguagePreference = "system" | "en" | "ja";

export interface Preferences {
  /** Whether sample Deck bootstrap is pending; cleared after the sample Deck is loaded. */
  loadSample: boolean;
  /** Locale override; system follows the browser language. */
  language: LanguagePreference;
  /** Visual presentation settings. */
  appearance: {
    /** Whether the dark color theme is enabled. */
    darkMode: boolean;
    /** Retained fullscreen preference; currently unused by the UI. */
    fullscreen: boolean;
    /** Retained non-negative answer text size preference; currently unused by the UI. */
    sizeBackText: number;
    /** Whether changing Cards hides the answer. */
    hideBodyWhenCardChanged: boolean;
    /** Whether swipe action feedback is displayed. */
    showSwipeFeedback: boolean;
  };
  /** Card selection and automatic playback settings. */
  study: {
    /** Study selection limit from 0 through 100 Cards; zero means no limit. */
    maxNumberOfCardsToLearn: number;
    /** Whether the selected Card order is shuffled. */
    shuffled: boolean;
    /** Whether study selection respects FSRS due dates, excluding future Cards and prioritizing due Cards. */
    useCardInterval: boolean;
    /** Automatic playback interval from 0 through 60 seconds; zero disables the timer. */
    cardInterval: number;
    /** Retained answer visibility preference; currently unused by playback. */
    keepBackTextViewed: boolean;
    /** Whether automatic playback starts enabled. */
    defaultAutoPlay: boolean;
    /** Retained global tag preference; current study selection uses Deck tags. */
    selectedTags: string[];
  };
  /** Study controls and swipe gesture assignments. */
  controls: {
    /** Whether the study view mode is active. */
    viewMode: boolean;
    /** Whether the view-mode control is visible. */
    showViewMode: boolean;
    /** Whether the help control is visible. */
    showHelp: boolean;
    /** Whether the Card edit link is visible. */
    showEditLink: boolean;
    /** Whether swipe action buttons are visible. */
    showSwipeButtonList: boolean;
    /** Whether playback controls are visible. */
    showPlaybackControls: boolean;
    /** Whether Card details are visible. */
    showCardDetails: boolean;
    /** Whether swipe overlays appear on the answer. */
    showBackTextSwipeOverlays: boolean;
    /** Whether the skip control is visible. */
    showSkip: boolean;
    /** Action triggered by an upward Card swipe. */
    cardSwipeUp: SwipeAction;
    /** Action triggered by a downward Card swipe. */
    cardSwipeDown: SwipeAction;
    /** Action triggered by a leftward Card swipe. */
    cardSwipeLeft: SwipeAction;
    /** Action triggered by a rightward Card swipe. */
    cardSwipeRight: SwipeAction;
  };
}

/** Gesture direction that can be mapped to a study control action. */
export type SwipeDirection = "cardSwipeUp" | "cardSwipeDown" | "cardSwipeLeft" | "cardSwipeRight";

/** Partial updates; omitted fields preserve their saved values. */
export type PartialPreferences = {
  /** Updates sample Deck loading. */
  loadSample?: Preferences["loadSample"];
  /** Updates the locale selection. */
  language?: Preferences["language"];
  /** Updates only the supplied visual settings. */
  appearance?: Partial<Preferences["appearance"]>;
  /** Updates only the supplied study settings. */
  study?: Partial<Preferences["study"]>;
  /** Updates only the supplied controls and gesture assignments. */
  controls?: Partial<Preferences["controls"]>;
};
