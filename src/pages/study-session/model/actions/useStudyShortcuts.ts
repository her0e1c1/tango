import { useKey, useLatest } from "react-use";
import { toggleShowSwipeButtonList } from "@/entities/preference";
import { swipeCard } from "./swipeCard";
import { toggleBackText } from "./toggleBackText";
import { toggleAutoPlay } from "./toggleAutoPlay";

import { runStudyShortcut } from "./runStudyShortcut";
import type { StudyShortcutAction } from "../queries/canRunStudyShortcut";

export function useStudyShortcuts({
  uid,
  deckId,
  status,
  helpOpen,
  showBackText,
}: {
  uid: string;
  deckId: string;
  status: "studying" | "preparing" | "invalid";
  helpOpen: boolean;
  showBackText: boolean;
}): void {
  const latestShortcuts = useLatest({
    status,
    helpOpen,
    showBackText,
    swipeUp: () => void swipeCard(uid, deckId, "cardSwipeUp"),
    swipeDown: () => void swipeCard(uid, deckId, "cardSwipeDown"),
    swipeLeft: () => void swipeCard(uid, deckId, "cardSwipeLeft"),
    swipeRight: () => void swipeCard(uid, deckId, "cardSwipeRight"),
    toggleBackText,
    toggleAutoPlay,
    toggleSwipeButtonList: toggleShowSwipeButtonList,
  });
  const runWhileStudying = (action: StudyShortcutAction) => (event: KeyboardEvent) => {
    const current = latestShortcuts.current;
    runStudyShortcut(
      event,
      action,
      { status: current.status, helpOpen: current.helpOpen, showBackText: current.showBackText },
      current[action]
    );
  };

  // useKey retains its initial handler, so that handler reads current Page state through one stable ref.
  useKey("ArrowUp", runWhileStudying("swipeUp"));
  useKey("ArrowDown", runWhileStudying("swipeDown"));
  useKey("ArrowLeft", runWhileStudying("swipeLeft"));
  useKey("ArrowRight", runWhileStudying("swipeRight"));
  useKey("Enter", runWhileStudying("toggleBackText"));
  useKey("b", runWhileStudying("toggleSwipeButtonList"));
  useKey(" ", runWhileStudying("toggleAutoPlay"));
}
