import { shouldIgnoreCardShortcut } from "@/features/card-player";

export type StudyShortcutAction =
  | "swipeUp"
  | "swipeDown"
  | "swipeLeft"
  | "swipeRight"
  | "toggleBackText"
  | "toggleSwipeButtonList"
  | "toggleAutoPlay";

const isDirectionalStudyAction = (action: StudyShortcutAction): boolean =>
  action === "swipeUp" || action === "swipeDown" || action === "swipeLeft" || action === "swipeRight";

export function canRunStudyShortcut(
  event: KeyboardEvent,
  action: StudyShortcutAction,
  state: { status: string; helpOpen: boolean; showBackText: boolean }
): boolean {
  // Help owns every key; an answer also keeps directional gestures inert.
  if (state.status !== "studying" || state.helpOpen || shouldIgnoreCardShortcut(event)) return false;
  return !(state.showBackText && isDirectionalStudyAction(action));
}
