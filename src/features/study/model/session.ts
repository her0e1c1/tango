import type { SwipeAction } from "@/entities/preferences";

export const calculateNextIndex = (currentIndex: number, cardCount: number, swipeAction: SwipeAction): number => {
  let nextIndex = currentIndex;
  if (swipeAction === "GoToPrevCard") {
    nextIndex -= 1;
  } else {
    nextIndex += 1;
  }
  if (nextIndex >= 0 && nextIndex < cardCount) {
    return nextIndex;
  }
  return -1;
};
