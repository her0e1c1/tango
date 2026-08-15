import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { SwipeDirection } from "@/entities/preferences";
import type { StudyProgress } from "@/entities/study-progress";

import type * as React from "react";

import type { ControllerProps } from "./Controller";
import type { SwipeButtonListProps } from "./SwipeButtonList";
import { useActiveStudySession, useStudySessionLifecycle } from "../hooks/useActiveStudySession";
import { useStudyActions, type StudyActions } from "../hooks/useStudyActions";
import { useStudyControllerState } from "../hooks/useStudyControllerState";
import { useStudyDisplayState } from "../hooks/useStudyDisplayState";
import { useStudyProgressMutation } from "../hooks/useStudyProgressMutation";
import { useSwipeFeedback } from "../hooks/useSwipeFeedback";
import type { StudyCard } from "../model/studyCard";

type PresentationActions = Pick<
  StudyActions,
  "swipeUp" | "swipeDown" | "swipeLeft" | "swipeRight" | "toggleShowBackText"
>;

type ShortcutActions = PresentationActions & Pick<StudyActions, "toggleAutoPlay">;

export type StudyWorkflowState = { shortcutActions: ShortcutActions } & (
  | { status: "loading" | "unavailable" }
  | {
      status: "ready";
      card: Card;
      progress: StudyProgress;
      showHeader: boolean;
      showBackText: boolean;
      showController: boolean;
      showSwipeButtonList: boolean;
      swipeFeedback?: SwipeDirection;
      actions: PresentationActions;
      controller: ControllerProps;
      swipeActions: SwipeButtonListProps;
    }
);

interface StudyWorkflowProps {
  cards: readonly StudyCard[];
  deckId: DeckId;
  onUnavailable: () => void;
  children: (state: StudyWorkflowState) => React.ReactNode;
}

export const StudyWorkflow = ({ cards, deckId, onUnavailable, children }: StudyWorkflowProps) => {
  const display = useStudyDisplayState();
  const feedback = useSwipeFeedback(display.preferences.appearance.showSwipeFeedback);
  const progressMutation = useStudyProgressMutation();
  const actions = useStudyActions(deckId, {
    cards,
    cardMutation: { update: progressMutation.save },
    onSwipe: feedback.showSwipe,
    showBackText: display.showBackText,
    onHideBackText: display.hideBackText,
    onToggleBackText: display.toggleBackText,
    onRestoreBackText: display.restoreBackText,
    onToggleAutoPlay: display.toggleAutoPlay,
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
    onToggleAutoPlay: actions.toggleAutoPlay,
  });

  if (session.status !== "ready") return children({ ...session, shortcutActions: actions });

  const swipeActions: SwipeButtonListProps = {
    disabled: false,
    onClickUp: actions.swipeUp,
    onClickDown: actions.swipeDown,
    onClickLeft: actions.swipeLeft,
    onClickRight: actions.swipeRight,
  };
  const state: StudyWorkflowState = {
    status: "ready",
    shortcutActions: actions,
    card: session.card,
    progress: session.progress,
    showHeader: display.preferences.appearance.showHeader && !display.showBackText,
    showBackText: display.showBackText,
    showController: display.preferences.study.cardInterval > 0,
    showSwipeButtonList: display.preferences.controls.showSwipeButtonList,
    actions,
    controller,
    swipeActions,
    ...(feedback.lastSwipe !== undefined ? { swipeFeedback: feedback.lastSwipe } : {}),
  };
  return children(state);
};
