import type { Preferences } from "@/entities/preference";

export interface SettingsFormValues {
  language: Preferences["language"];
  appearance: Pick<Preferences["appearance"], "darkMode" | "showSwipeFeedback">;
  controls: Pick<
    Preferences["controls"],
    "showSwipeButtonList" | "showBackTextSwipeOverlays" | "showPlaybackControls" | "showCardDetails" | "showSkip"
  >;
  study: Pick<
    Preferences["study"],
    "shuffled" | "maxNumberOfCardsToLearn" | "useCardInterval" | "defaultAutoPlay" | "cardInterval"
  >;
}

export function getSettingsFormValues(preferences: Preferences): SettingsFormValues {
  return {
    language: preferences.language,
    appearance: {
      darkMode: preferences.appearance.darkMode,
      showSwipeFeedback: preferences.appearance.showSwipeFeedback,
    },
    controls: {
      showSwipeButtonList: preferences.controls.showSwipeButtonList,
      showBackTextSwipeOverlays: preferences.controls.showBackTextSwipeOverlays,
      showPlaybackControls: preferences.controls.showPlaybackControls,
      showCardDetails: preferences.controls.showCardDetails,
      showSkip: preferences.controls.showSkip,
    },
    study: {
      shuffled: preferences.study.shuffled,
      maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
      useCardInterval: preferences.study.useCardInterval,
      defaultAutoPlay: preferences.study.defaultAutoPlay,
      cardInterval: preferences.study.cardInterval,
    },
  };
}
