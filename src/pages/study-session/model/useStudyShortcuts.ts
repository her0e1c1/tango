import { useKey, useLatest } from "react-use";
import { getPreferences, toggleShowSwipeButtonList } from "@/entities/preference";
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
  deckId,
  status,
  helpOpen,
  showBackText,
}: {
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
      swipeUp: () => void swipeCard(deckId, "cardSwipeUp"),
      swipeDown: () => void swipeCard(deckId, "cardSwipeDown"),
      swipeLeft: () => void swipeCard(deckId, "cardSwipeLeft"),
      swipeRight: () => void swipeCard(deckId, "cardSwipeRight"),
      toggleBackText,
      toggleAutoPlay,
      toggleSwipeButtonList: toggleShowSwipeButtonList,
    },
  });
  const shortcuts: Record<string, StudyShortcutAction> = {
    ArrowUp: "swipeUp",
    ArrowDown: "swipeDown",
    ArrowLeft: "swipeLeft",
    ArrowRight: "swipeRight",
    Enter: "toggleBackText",
    b: "toggleSwipeButtonList",
    " ": "toggleAutoPlay",
  };
  const runWhileStudying = (event: KeyboardEvent) => {
    const action = shortcuts[event.key];
    if (action === undefined) return;
    // Native editing and activation keys take precedence, while unrelated Study shortcuts remain
    // available after a user moves focus into the card or floating controls.
    // A held Enter must not exit reading mode and then flip the same card.
    if (event.repeat && action === "toggleBackText") return;
    const currentStudy = latestShortcuts.current;
    // A modal Help surface owns every key while open, including keys without native dialog behavior.
    if (currentStudy.status !== "studying" || currentStudy.helpOpen || shouldIgnoreCardShortcut(event)) return;
    const directional = isDirectionalStudyAction(action);
    const reading = !currentStudy.showBackText && getPreferences().controls.viewMode;
    const blockedByReading = reading && (directional || action === "toggleAutoPlay");
    // Directional keys are an input gesture, so the answer keeps them inert even though edge overlays can act.
    const blockedByAnswer = currentStudy.showBackText && directional;
    if (blockedByReading || blockedByAnswer) return;
    currentStudy.actions[action]();
  };

  useKey((event) => Object.hasOwn(shortcuts, event.key), runWhileStudying);
}
