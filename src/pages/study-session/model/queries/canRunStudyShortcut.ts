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

const studyShortcutTextEntryTarget =
  "input:not([type]), input[type='text'], input[type='search'], input[type='email'], input[type='url'], input[type='tel'], input[type='password'], input[type='number'], input[type='date'], input[type='datetime-local'], input[type='month'], input[type='time'], input[type='week'], textarea, select";
const studyShortcutButtonTarget =
  "a[href], button, summary, input[type='button'], input[type='submit'], input[type='reset'], input[type='checkbox'], input[type='radio'], [role='button'], [role='link'], [role='switch'], [role='checkbox'], [role='radio'], [role='tab']";
const studyShortcutSliderTarget = "input[type='range'], [role='slider']";
const studyShortcutAnswerScrollTarget = "[data-study-answer-scroll]";

const shouldIgnoreStudyShortcut = (event: KeyboardEvent): boolean => {
  if (!(event.target instanceof Element)) return false;
  if (event.target.closest(studyShortcutTextEntryTarget) !== null) return true;
  const editableTarget = event.target.closest("[contenteditable]");
  if (editableTarget !== null && editableTarget.getAttribute("contenteditable") !== "false") return true;
  if ((event.key === "Enter" || event.key === " ") && event.target.closest(studyShortcutButtonTarget) !== null) {
    return true;
  }
  if (event.key === " " && event.target.closest(studyShortcutAnswerScrollTarget) !== null) return true;
  return event.key.startsWith("Arrow") && event.target.closest(studyShortcutSliderTarget) !== null;
};

export function canRunStudyShortcut(
  event: KeyboardEvent,
  action: StudyShortcutAction,
  state: { status: string; helpOpen: boolean; showBackText: boolean }
): boolean {
  // Help owns every key; an answer also keeps directional gestures inert.
  if (state.status !== "studying" || state.helpOpen || shouldIgnoreStudyShortcut(event)) return false;
  return !(state.showBackText && isDirectionalStudyAction(action));
}
