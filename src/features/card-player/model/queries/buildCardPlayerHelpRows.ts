import type { Preferences, SwipeDirection } from "@/entities/preference";

type SwipeAction = Preferences["controls"][SwipeDirection];

type StudyHelpControlId =
  | SwipeDirection
  | "viewMode"
  | "flip"
  | "autoPlay"
  | "swipeButtons"
  | "playbackControls"
  | "skipControls"
  | "cardDetails"
  | "exit";

type StudyHelpActionId =
  | "viewModeHidden"
  | "enterViewMode"
  | "exitViewMode"
  | "viewModeScroll"
  | "viewModeAutoPlay"
  | SwipeAction
  | "previousCard"
  | "flip"
  | "autoPlay"
  | "autoPlayUnavailable"
  | "swipeButtonsVisible"
  | "swipeButtonsHidden"
  | "playbackControlsVisible"
  | "playbackControlsHidden"
  | "playbackControlsUnavailable"
  | "skipControlsVisible"
  | "skipControlsHidden"
  | "cardDetails"
  | "exit";

interface StudyHelpRow {
  control: StudyHelpControlId;
  action: StudyHelpActionId;
}

const directionOrder: readonly SwipeDirection[] = ["cardSwipeUp", "cardSwipeDown", "cardSwipeLeft", "cardSwipeRight"];

export const buildCardPlayerHelpRows = (
  preferences: Preferences,
  mappings: Partial<Record<SwipeDirection, SwipeAction | "previousCard">> = {},
  includeSkipControl = true
): readonly StudyHelpRow[] => {
  const viewMode = preferences.controls.viewMode;
  const playbackAvailable = preferences.study.cardInterval > 0;
  const rows: StudyHelpRow[] = directionOrder.map((direction) => ({
    control: direction,
    action: viewMode ? "viewModeScroll" : (mappings[direction] ?? preferences.controls[direction]),
  }));

  rows.push(
    {
      control: "viewMode",
      action: !preferences.controls.showViewMode ? "viewModeHidden" : viewMode ? "exitViewMode" : "enterViewMode",
    },
    { control: "flip", action: viewMode ? "exitViewMode" : "flip" },
    {
      control: "autoPlay",
      action: playbackAvailable ? (viewMode ? "viewModeAutoPlay" : "autoPlay") : "autoPlayUnavailable",
    },
    {
      control: "swipeButtons",
      action: preferences.controls.showSwipeButtonList ? "swipeButtonsVisible" : "swipeButtonsHidden",
    },
    {
      control: "playbackControls",
      action: playbackAvailable
        ? preferences.controls.showPlaybackControls
          ? "playbackControlsVisible"
          : "playbackControlsHidden"
        : "playbackControlsUnavailable",
    }
  );
  if (includeSkipControl) {
    rows.push({
      control: "skipControls",
      action: preferences.controls.showSkip ? "skipControlsVisible" : "skipControlsHidden",
    });
  }
  rows.push({ control: "cardDetails", action: "cardDetails" }, { control: "exit", action: "exit" });

  return rows;
};
