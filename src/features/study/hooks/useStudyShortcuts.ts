import { toggleShowHeader, toggleShowSwipeButtonList } from "@/entities/preferences";

import { useKey } from "react-use";

import type { StudyActions } from "./useStudyActions";

export const useStudyShortcuts = (actions: StudyActions) => {
  useKey("ArrowUp", actions.swipeUp);
  useKey("ArrowDown", actions.swipeDown);
  useKey("ArrowLeft", actions.swipeLeft);
  useKey("ArrowRight", actions.swipeRight);
  useKey("Enter", actions.toggleShowBackText);
  useKey("h", toggleShowHeader);
  useKey("b", toggleShowSwipeButtonList);
  useKey(" ", actions.toggleAutoPlay);
};
