import type { RefObject } from "react";
import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { Preferences, SwipeDirection } from "@/entities/preference";
import { editStudyProgress } from "@/entities/study-progress";
import { getStudySession, moveStudySession, planStudySessionSwipe, removeStudySession } from "@/entities/study-session";
import type { StudyCompletion } from "../types";

interface SwipeCardOptions {
  uid: string;
  deckId: DeckId;
  cards: readonly Card[];
  direction: SwipeDirection;
  swipeAction: Preferences["controls"][SwipeDirection];
  showFeedback: boolean;
  hideBodyWhenCardChanged: boolean;
  pendingRef: RefObject<boolean>;
  isMounted: () => boolean;
  onCardChanged: () => void;
  onCompleted: (completion: StudyCompletion) => void;
  onSwipeFeedback: (direction: SwipeDirection) => void;
}

export const swipeCard = async ({
  uid,
  deckId,
  cards,
  direction,
  swipeAction,
  showFeedback,
  hideBodyWhenCardChanged,
  pendingRef,
  isMounted,
  onCardChanged,
  onCompleted,
  onSwipeFeedback,
}: SwipeCardOptions): Promise<void> => {
  // Persistence yields to later gestures; every direction must share this synchronous lock.
  if (pendingRef.current) return;
  const plan = planStudySessionSwipe(getStudySession(deckId), cards, swipeAction, Date.now());
  if (plan.effect === "none") return;
  if (plan.effect === "exit") {
    removeStudySession(deckId);
    if (showFeedback && isMounted()) onSwipeFeedback(direction);
    return;
  }
  // A boundary move removes the session, so completion uses the pre-write snapshot.
  const completesSession = plan.effect === "next" && plan.session.currentIndex === plan.session.cardOrderIds.length - 1;
  const cardCount = plan.session.cardOrderIds.length;
  pendingRef.current = true;
  // Advance only after persistence succeeds; failed writes leave the visible session unchanged.
  const saved = await editStudyProgress(uid, plan.progress).then(
    () => true,
    () => false
  );
  pendingRef.current = false;
  if (!saved) return;
  if (!moveStudySession(plan.session, plan.effect)) return;
  // Persistence may finish after navigation, but feedback and route-owned state must not leak.
  if (!isMounted()) return;
  if (showFeedback) onSwipeFeedback(direction);
  if (completesSession) {
    onCompleted({ cardCount });
    return;
  }
  if (hideBodyWhenCardChanged) onCardChanged();
};
