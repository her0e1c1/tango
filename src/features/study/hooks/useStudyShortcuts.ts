import { toggleShowHeader, toggleShowSwipeButtonList } from "@/entities/preferences";

import { useKey } from "react-use";

import { isInteractiveShortcutTarget } from "@/shared/lib/isInteractiveShortcutTarget";

import type { StudyActions } from "./useStudyActions";

export const useStudyShortcuts = (actions: StudyActions) => {
  useKey("ArrowUp", (event) => {
    if (isInteractiveShortcutTarget(event.target)) return;
    void actions.swipeUp();
  });
  useKey("ArrowDown", (event) => {
    if (isInteractiveShortcutTarget(event.target)) return;
    void actions.swipeDown();
  });
  useKey("ArrowLeft", (event) => {
    if (isInteractiveShortcutTarget(event.target)) return;
    void actions.swipeLeft();
  });
  useKey("ArrowRight", (event) => {
    if (isInteractiveShortcutTarget(event.target)) return;
    void actions.swipeRight();
  });
  useKey("Enter", (event) => {
    if (isInteractiveShortcutTarget(event.target)) return;
    actions.toggleShowBackText();
  });
  useKey("h", (event) => {
    if (isInteractiveShortcutTarget(event.target)) return;
    toggleShowHeader();
  });
  useKey("b", (event) => {
    if (isInteractiveShortcutTarget(event.target)) return;
    toggleShowSwipeButtonList();
  });
  useKey(" ", (event) => {
    if (isInteractiveShortcutTarget(event.target)) return;
    actions.toggleAutoPlay();
  });
};
