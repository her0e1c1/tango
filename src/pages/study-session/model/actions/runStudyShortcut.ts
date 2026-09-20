import { toggleShowSwipeButtonList } from "@/entities/preference";
import { shouldIgnoreCardShortcut } from "@/features/card-player";
import { studySessionPageStore } from "../store";
import { swipeCard } from "./swipeCard";
import { toggleBackText } from "./toggleBackText";
import { toggleAutoPlay } from "./toggleAutoPlay";

export function runStudyShortcut(
  event: KeyboardEvent,
  uid: string,
  deckId: string,
  status: "studying" | "preparing" | "invalid"
): void {
  const { owner, pageState } = studySessionPageStore.getState();
  // The active visit owns help and answer state even before React has rendered a state change.
  if (
    owner?.uid !== uid ||
    owner.deckId !== deckId ||
    status !== "studying" ||
    pageState.helpOpen ||
    shouldIgnoreCardShortcut(event)
  )
    return;
  if (event.key.startsWith("Arrow") && pageState.showBackText) return;
  switch (event.key) {
    case "ArrowUp":
      void swipeCard(uid, deckId, "cardSwipeUp");
      break;
    case "ArrowDown":
      void swipeCard(uid, deckId, "cardSwipeDown");
      break;
    case "ArrowLeft":
      void swipeCard(uid, deckId, "cardSwipeLeft");
      break;
    case "ArrowRight":
      void swipeCard(uid, deckId, "cardSwipeRight");
      break;
    case "Enter":
      toggleBackText();
      break;
    case "b":
      toggleShowSwipeButtonList();
      break;
    case " ":
      toggleAutoPlay();
      break;
  }
}
