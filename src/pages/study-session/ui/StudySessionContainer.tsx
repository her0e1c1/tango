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
  | "toggleHeader"
  | "toggleSwipeButtonList"
  | "toggleAutoPlay";

const renderStudyScreen = (state: StudyState | undefined) => {
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
    <AppLayout fullscreen scroll={state.showBackText} showHeader={state.showHeader}>
      <StudySession
        showController={state.showController}
        showBackText={state.showBackText}
        showSwipeButtonList={state.showSwipeButtonList}
        {...(state.swipeFeedback !== undefined ? { swipeFeedback: state.swipeFeedback } : {})}
        frontTextSlot={
          <FrontText
            category={state.card.category}
            text={state.card.frontText}
            onSwipeUp={swipeActions.onClickUp}
            onSwipeDown={swipeActions.onClickDown}
            onSwipeLeft={swipeActions.onClickLeft}
            onSwipeRight={swipeActions.onClickRight}
            onClick={state.toggleBackText}
          />
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
  const runWhileStudying = (action: StudyShortcutAction) => () => {
    const currentStudy = latestStudy.current;
    if (currentStudy?.status === "studying") void currentStudy[action]();
  };

  // useKey retains its initial handler, so that handler reads current Page state through one stable ref.
  useKey("ArrowUp", runWhileStudying("swipeUp"));
  useKey("ArrowDown", runWhileStudying("swipeDown"));
  useKey("ArrowLeft", runWhileStudying("swipeLeft"));
  useKey("ArrowRight", runWhileStudying("swipeRight"));
  useKey("Enter", runWhileStudying("toggleBackText"));
  useKey("h", runWhileStudying("toggleHeader"));
  useKey("b", runWhileStudying("toggleSwipeButtonList"));
  useKey(" ", runWhileStudying("toggleAutoPlay"));

  React.useEffect(() => {
    if (study?.status !== "invalid") return;
    void navigate(routes.deckList.to(), { replace: true });
  }, [navigate, study?.status]);

  return renderStudyScreen(study);
};

export const StudySessionContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const deck = useDeck(deckId);

  // Study lifecycle mutates session state, so an unavailable route Deck must not mount it.
  if (deck == null) return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  return <ActiveStudySessionContainer deckId={deckId} />;
};
