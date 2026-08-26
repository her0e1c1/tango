import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey, useLatest } from "react-use";

import { useDeck } from "@/entities/deck";
import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import { routes } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { type StudyState, useStudy } from "../model/useStudy";
import { StudySession } from "./StudySession";

type StudyShortcutAction =
  | "swipeUp"
  | "swipeDown"
  | "swipeLeft"
  | "swipeRight"
  | "toggleBackText"
  | "toggleSwipeButtonList"
  | "toggleAutoPlay";

const studyShortcutInteractiveTarget =
  "a[href], button, input, select, textarea, summary, [contenteditable]:not([contenteditable='false']), [role='button'], [role='link'], [role='slider'], [role='switch'], [role='checkbox'], [role='radio'], [role='tab'], [tabindex]:not([tabindex='-1'])";

const isInteractiveTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(studyShortcutInteractiveTarget) !== null;

const renderStudyScreen = (state: StudyState | undefined, onBack: () => void) => {
  if (state == null) return <RouteFeedback title="Study session unavailable." tone="not-found" />;

  if (state.status !== "studying") {
    return state.status === "preparing" ? (
      <RouteFeedback title="Loading…" tone="loading" />
    ) : (
      <RouteFeedback title="Study session unavailable." tone="not-found" />
    );
  }

  const swipeActions = {
    disabled: false,
    onClickUp: () => void state.swipeUp(),
    onClickDown: () => void state.swipeDown(),
    onClickLeft: () => void state.swipeLeft(),
    onClickRight: () => void state.swipeRight(),
  };

  return (
    <AppLayout fullscreen showHeader={false}>
      <StudySession
        onBack={onBack}
        onToggleSwipeControls={state.toggleSwipeButtonList}
        onTogglePlaybackControls={state.toggleShowPlaybackControls}
        showBackText={state.showBackText}
        showSwipeControls={state.showSwipeButtonList}
        showPlaybackControls={state.showPlaybackControls}
        playbackControlsAvailable={state.playbackControlsAvailable}
        onSwipeUp={swipeActions.onClickUp}
        onSwipeDown={swipeActions.onClickDown}
        onSwipeLeft={swipeActions.onClickLeft}
        onSwipeRight={swipeActions.onClickRight}
        {...(state.swipeFeedback !== undefined ? { swipeFeedback: state.swipeFeedback } : {})}
        frontTextSlot={
          <FrontText category={state.card.category} text={state.card.frontText} onClick={state.toggleBackText} />
        }
        cardOverlaySlot={
          <CardOverlay
            score={state.card.score}
            numberOfSeen={state.card.numberOfSeen}
            {...(state.card.lastSeenAt !== undefined ? { lastSeenAt: state.card.lastSeenAt } : {})}
          />
        }
        backTextSlot={<CardView {...state.card.back} onClick={state.toggleBackText} variant="bare" />}
        controller={{
          autoPlay: state.autoPlay,
          index: state.session.currentIndex,
          numberOfCards: state.session.cardCount,
          onChange: state.updateIndex,
          onToggleAutoPlay: state.toggleAutoPlay,
        }}
        swipeButtonList={swipeActions}
        swipeOverlay={swipeActions}
      />
    </AppLayout>
  );
};

const ActiveStudySessionContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const navigate = useNavigate();
  const study = useStudy(deckId);
  const latestStudy = useLatest(study);
  const goBack = () => void navigate(routes.cardList.to(deckId));
  const runWhileStudying = (action: StudyShortcutAction) => (event: KeyboardEvent) => {
    // Study shortcuts must not compete with native keyboard behavior on toolbar and controller controls.
    if (isInteractiveTarget(event.target)) return;
    const currentStudy = latestStudy.current;
    if (currentStudy?.status === "studying") void currentStudy[action]();
  };

  // useKey retains its initial handler, so that handler reads current Page state through one stable ref.
  useKey("ArrowUp", runWhileStudying("swipeUp"));
  useKey("ArrowDown", runWhileStudying("swipeDown"));
  useKey("ArrowLeft", runWhileStudying("swipeLeft"));
  useKey("ArrowRight", runWhileStudying("swipeRight"));
  useKey("Enter", runWhileStudying("toggleBackText"));
  useKey("b", runWhileStudying("toggleSwipeButtonList"));
  useKey(" ", runWhileStudying("toggleAutoPlay"));

  React.useEffect(() => {
    if (study?.status !== "invalid") return;
    void navigate(routes.deckList.to(), { replace: true });
  }, [navigate, study?.status]);

  return renderStudyScreen(study, goBack);
};

export const StudySessionContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const deck = useDeck(deckId);

  // Study lifecycle mutates session state, so an unavailable route Deck must not mount it.
  if (deck == null) return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  return <ActiveStudySessionContainer deckId={deckId} />;
};
