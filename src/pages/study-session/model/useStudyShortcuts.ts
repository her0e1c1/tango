import { useKey, useLatest } from "react-use";
import { toggleShowSwipeButtonList } from "@/entities/preference";
import { shouldIgnoreCardShortcut } from "@/features/card-player";
import { swipeCard } from "./actions/swipeCard";
import { toggleBackText } from "./actions/toggleBackText";
import { toggleAutoPlay } from "./actions/toggleAutoPlay";

type StudyShortcutAction =
  | "swipeUp"
  | "swipeDown"
  | "swipeLeft"
  | "swipeRight"
  | "toggleBackText"
  | "toggleSwipeButtonList"
  | "toggleAutoPlay";

const isDirectionalStudyAction = (action: StudyShortcutAction): boolean =>
  action === "swipeUp" || action === "swipeDown" || action === "swipeLeft" || action === "swipeRight";

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
    actions: {
      swipeUp: () => void swipeCard(uid, deckId, "cardSwipeUp"),
      swipeDown: () => void swipeCard(uid, deckId, "cardSwipeDown"),
      swipeLeft: () => void swipeCard(uid, deckId, "cardSwipeLeft"),
      swipeRight: () => void swipeCard(uid, deckId, "cardSwipeRight"),
      toggleBackText,
      toggleAutoPlay,
      toggleSwipeButtonList: toggleShowSwipeButtonList,
    },
  });
  const runWhileStudying = (action: StudyShortcutAction) => (event: KeyboardEvent) => {
    // Native editing and activation keys take precedence, while unrelated Study shortcuts remain
    // available after a user moves focus into the card or floating controls.
    const currentStudy = latestShortcuts.current;
    // A modal Help surface owns every key while open, including keys without native dialog behavior.
    if (currentStudy.status !== "studying" || currentStudy.helpOpen || shouldIgnoreCardShortcut(event)) return;
    // Directional keys are an input gesture, so the answer keeps them inert even though edge overlays can act.
    if (currentStudy.showBackText && isDirectionalStudyAction(action)) return;
    currentStudy.actions[action]();
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
