import type { SwipeAction, SwipeState } from "@/entities/preferences";

const swipeActionLabels: Record<SwipeAction, string> = {
  DoNothing: "No action",
  GoBack: "Exit study",
  GoToPrevCard: "Previous card",
  GoToNextCard: "Next card",
  GoToNextCardMastered: "Mark mastered and next",
  GoToNextCardNotMastered: "Mark not mastered and next",
  GoToNextCardToggleMastered: "Toggle mastery and next",
};

export interface StudyHelpItem {
  control: string;
  action: string;
}

const getSwipeActionLabel = (action: SwipeAction): string => swipeActionLabels[action];

export const buildStudyHelpItems = (controls: SwipeState): StudyHelpItem[] => [
  { control: "Swipe/Arrow Up", action: getSwipeActionLabel(controls.cardSwipeUp) },
  { control: "Swipe/Arrow Down", action: getSwipeActionLabel(controls.cardSwipeDown) },
  { control: "Swipe/Arrow Left", action: getSwipeActionLabel(controls.cardSwipeLeft) },
  { control: "Swipe/Arrow Right", action: getSwipeActionLabel(controls.cardSwipeRight) },
  { control: "Enter", action: "Show/hide answer" },
  { control: "Space", action: "Play/pause autoplay" },
  { control: "H", action: "Show/hide header" },
  { control: "B", action: "Show/hide study buttons" },
];
