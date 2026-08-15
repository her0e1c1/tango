import type { Card, CardId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { SwipeDirection } from "@/entities/preferences";

import * as React from "react";

import { RouteFeedback } from "@/shared/ui/route-feedback";
import type { ControllerProps } from "./Controller";
import { StudyActionsBar } from "./StudyHelpDialog";
import { StudyCompletionScreen, StudyUnavailableScreen, StudyVerificationErrorScreen } from "./StudyStatusScreen";
import type { SwipeButtonListProps } from "./SwipeButtonList";
import { useActiveStudySession, useStudySessionLifecycle } from "../hooks/useActiveStudySession";
import { useEditStudyProgress } from "../hooks/useEditStudyProgress";
import { useStudyActions, type StudyActions } from "../hooks/useStudyActions";
import { useStudyControllerState } from "../hooks/useStudyControllerState";
import { useStudyDisplayState } from "../hooks/useStudyDisplayState";
import { useStudyShortcuts } from "../hooks/useStudyShortcuts";
import { useSwipeFeedback } from "../hooks/useSwipeFeedback";

type PresentationActions = Pick<
  StudyActions,
  "swipeUp" | "swipeDown" | "swipeLeft" | "swipeRight" | "toggleShowBackText"
>;

export interface ActiveStudyWorkflowState {
  status: "active";
  card: Card;
  showHeader: boolean;
  showBackText: boolean;
  showController: boolean;
  showSwipeButtonList: boolean;
  swipeFeedback?: SwipeDirection;
  actions: PresentationActions;
  controller: ControllerProps;
  swipeActions: SwipeButtonListProps;
}

interface StudyWorkflowProps {
  cards: readonly Card[];
  deckId: DeckId;
  deckName: string;
  onExit: (deckId: DeckId) => void;
  onSetupStudy: (deckId: DeckId) => void;
  onBackToDeck: (deckId: DeckId) => void;
  children: (state: ActiveStudyWorkflowState) => React.ReactNode;
}

export const StudyWorkflow = ({
  cards,
  deckId,
  deckName,
  onExit,
  onSetupStudy,
  onBackToDeck,
  children,
}: StudyWorkflowProps) => {
  const display = useStudyDisplayState();
  const feedback = useSwipeFeedback(display.preferences.appearance.showSwipeFeedback);
  const [completedOrder, setCompletedOrder] = React.useState<CardId[] | undefined>(undefined);
  const cardMutation = useEditStudyProgress();
  const actions = useStudyActions(deckId, {
    cards,
    cardMutation: { update: cardMutation.update },
    onSwipe: feedback.showSwipe,
    showBackText: display.showBackText,
    onHideBackText: display.hideBackText,
    onToggleBackText: display.toggleBackText,
    onRestoreBackText: display.restoreBackText,
    onToggleAutoPlay: display.toggleAutoPlay,
    onStopAutoPlay: display.stopAutoPlay,
    onExit,
    onCompleted: ({ cardOrderIds }) => setCompletedOrder(cardOrderIds),
  });
  const session = useActiveStudySession(deckId, cards);
  useStudySessionLifecycle({ deckId, session, resetStudy: actions.resetStudy });
  useStudyShortcuts(actions, session.status === "active" && completedOrder == null);

  const controller = useStudyControllerState({
    autoPlay: display.autoPlay,
    cardInterval: display.preferences.study.cardInterval,
    enabled: session.status === "active" && completedOrder == null && display.preferences.study.cardInterval > 0,
    index: session.status === "active" ? session.index : -1,
    numberOfCards: session.status === "active" ? session.cardOrderIds.length : 0,
    onChange: actions.updateIndex,
    onToggleAutoPlay: actions.toggleAutoPlay,
    onStopAutoPlay: display.stopAutoPlay,
  });

  if (completedOrder != null) {
    return (
      <StudyCompletionScreen
        deckName={deckName}
        cardCount={completedOrder.length}
        onRestart={() => {
          actions.restart(completedOrder);
          setCompletedOrder(undefined);
        }}
        onBackToDeck={() => onBackToDeck(deckId)}
      />
    );
  }
  if (session.status === "loading") return <RouteFeedback title="Loading…" tone="loading" />;
  if (session.status === "unavailable") {
    return (
      <StudyUnavailableScreen onSetupStudy={() => onSetupStudy(deckId)} onBackToDeck={() => onBackToDeck(deckId)} />
    );
  }
  if (session.status === "error") {
    return <StudyVerificationErrorScreen retry={session.retry} onBackToDeck={() => onBackToDeck(deckId)} />;
  }

  const swipeActions: SwipeButtonListProps = {
    disabled: false,
    onClickUp: actions.swipeUp,
    onClickDown: actions.swipeDown,
    onClickLeft: actions.swipeLeft,
    onClickRight: actions.swipeRight,
  };
  const state: ActiveStudyWorkflowState = {
    status: "active",
    card: session.card,
    showHeader: display.preferences.appearance.showHeader && !display.showBackText,
    showBackText: display.showBackText,
    showController: display.preferences.study.cardInterval > 0,
    showSwipeButtonList: display.preferences.controls.showSwipeButtonList,
    actions,
    controller,
    swipeActions,
    ...(feedback.lastSwipe !== undefined ? { swipeFeedback: feedback.lastSwipe } : {}),
  };

  return (
    <>
      {children(state)}
      <StudyActionsBar controls={display.preferences.controls} onExit={actions.exitStudy} />
    </>
  );
};
