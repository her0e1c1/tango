import { toggleShowHeader, toggleShowSwipeButtonList } from "@/entities/preferences";

import { useKey } from "react-use";

import { isInteractiveShortcutTarget } from "@/shared/lib/isInteractiveShortcutTarget";
import type { StudyActions } from "./useStudyActions";

export const useStudyShortcuts = (actions: StudyActions, enabled = true) => {
  const runUnlessInteractive = (action: () => void | Promise<void>) => (event: KeyboardEvent) => {
    if (enabled && !isInteractiveShortcutTarget(event.target)) void action();
  };
  useKey("ArrowUp", runUnlessInteractive(actions.swipeUp));
  useKey("ArrowDown", runUnlessInteractive(actions.swipeDown));
  useKey("ArrowLeft", runUnlessInteractive(actions.swipeLeft));
  useKey("ArrowRight", runUnlessInteractive(actions.swipeRight));
  useKey("Enter", runUnlessInteractive(actions.toggleShowBackText));
  useKey("h", runUnlessInteractive(toggleShowHeader));
  useKey("b", runUnlessInteractive(toggleShowSwipeButtonList));
  useKey(" ", runUnlessInteractive(actions.toggleAutoPlay));
};
