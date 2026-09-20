import type { Preferences, SwipeDirection } from "@/entities/preference";

type SwipeAction = Preferences["controls"][SwipeDirection];

type StudyHelpControlId =
  | SwipeDirection
  | "flip"
  | "autoPlay"
  | "swipeButtons"
  | "playbackControls"
  | "cardDetails"
  | "exit";

type StudyHelpActionId =
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
  | "cardDetails"
  | "exit";

interface StudyHelpRow {
  control: StudyHelpControlId;
  action: StudyHelpActionId;
}

const directionOrder: readonly SwipeDirection[] = ["cardSwipeUp", "cardSwipeDown", "cardSwipeLeft", "cardSwipeRight"];

export const buildCardPlayerHelpRows = (
  preferences: Preferences,
  mappings: Partial<Record<SwipeDirection, SwipeAction | "previousCard">> = {}
): readonly StudyHelpRow[] => {
  const playbackAvailable = preferences.study.cardInterval > 0;
  const rows: StudyHelpRow[] = directionOrder.map((direction) => ({
    control: direction,
    action: mappings[direction] ?? preferences.controls[direction],
  }));

  rows.push(
    { control: "flip", action: "flip" },
    {
      control: "autoPlay",
      action: playbackAvailable ? "autoPlay" : "autoPlayUnavailable",
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
    },
    { control: "cardDetails", action: "cardDetails" },
    { control: "exit", action: "exit" }
  );

  return rows;
};
