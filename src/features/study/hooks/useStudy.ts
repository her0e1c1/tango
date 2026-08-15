import { useAuthUid } from "@/entities/auth";
import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { SwipeDirection } from "@/entities/preferences";
import { editStudyProgress } from "@/entities/study-progress";

import * as React from "react";

import type { ControllerProps } from "../components/Controller";
import type { SwipeButtonListProps } from "../components/SwipeButtonList";
import { useActiveStudySession, useStudySessionLifecycle } from "./useActiveStudySession";
import { useStudyActions } from "./useStudyActions";
import { useStudyControllerState } from "./useStudyControllerState";
import { useStudyDisplayState } from "./useStudyDisplayState";
import { useSwipeFeedback } from "./useSwipeFeedback";

interface StudyCommands {
  swipeUp: () => Promise<void>;
  swipeDown: () => Promise<void>;
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
  toggleBackText: () => void;
  toggleAutoPlay: () => void;
}

export type StudyState = StudyCommands &
  (
    | { status: "loading" | "unavailable" }
    | {
        status: "ready";
        card: Card;
        showHeader: boolean;
        showBackText: boolean;
        showController: boolean;
        showSwipeButtonList: boolean;
        swipeFeedback?: SwipeDirection;
        controller: ControllerProps;
        swipeButtonList: SwipeButtonListProps;
      }
  );

export const useStudy = (deckId: DeckId, cards: readonly Card[], onUnavailable: () => void): StudyState => {
  const uid = useAuthUid();
  const display = useStudyDisplayState();
  const feedback = useSwipeFeedback(display.preferences.appearance.showSwipeFeedback);
  const saveProgress = React.useCallback(
    (progress: Parameters<typeof editStudyProgress>[1]) => editStudyProgress(uid, progress),
    [uid]
  );
  const actions = useStudyActions(deckId, {
    cards,
    saveProgress,
    onSwipe: feedback.showSwipe,
    onCardChanged: display.hideBackText,
  });
  const session = useActiveStudySession(deckId, cards);
  useStudySessionLifecycle({ deckId, session, resetStudy: actions.resetStudy, onUnavailable });

  const controller = useStudyControllerState({
    autoPlay: display.autoPlay,
    cardInterval: display.preferences.study.cardInterval,
    enabled: session.status === "ready" && display.preferences.study.cardInterval > 0,
    index: session.status === "ready" ? session.index : -1,
    numberOfCards: session.status === "ready" ? session.numberOfCards : 0,
    onChange: actions.updateIndex,
    onToggleAutoPlay: display.toggleAutoPlay,
  });
  const commands: StudyCommands = {
    swipeUp: actions.swipeUp,
    swipeDown: actions.swipeDown,
    swipeLeft: actions.swipeLeft,
    swipeRight: actions.swipeRight,
    toggleBackText: display.toggleBackText,
    toggleAutoPlay: display.toggleAutoPlay,
  };

  if (session.status !== "ready") return { ...session, ...commands };

  return {
    status: "ready",
    ...commands,
    card: session.card,
    showHeader: display.preferences.appearance.showHeader && !display.showBackText,
    showBackText: display.showBackText,
    showController: display.preferences.study.cardInterval > 0,
    showSwipeButtonList: display.preferences.controls.showSwipeButtonList,
    controller,
    swipeButtonList: {
      disabled: false,
      onClickUp: actions.swipeUp,
      onClickDown: actions.swipeDown,
      onClickLeft: actions.swipeLeft,
      onClickRight: actions.swipeRight,
    },
    ...(feedback.lastSwipe !== undefined ? { swipeFeedback: feedback.lastSwipe } : {}),
  };
};
