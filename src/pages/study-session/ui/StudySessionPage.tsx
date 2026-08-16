import * as React from "react";
import { useParams } from "react-router-dom";
import { useKey, useLatest } from "react-use";

import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import { routes, useNavigation } from "@/features/navigate";
import { DeckSwiperView, type StudyState, useStudy } from "@/features/study";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";
import { RouteEntityBoundary } from "@/widgets/route-entity-boundary";

type StudyShortcutAction =
  | "swipeUp"
  | "swipeDown"
  | "swipeLeft"
  | "swipeRight"
  | "toggleBackText"
  | "toggleHeader"
  | "toggleSwipeButtonList"
  | "toggleAutoPlay";

const renderStudyScreen = (state: StudyState) => {
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
      <DeckSwiperView
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

const StudySessionContent = ({ deckId }: { deckId: string }) => {
  const navigation = useNavigation();
  const study = useStudy(deckId);
  const latestStudy = useLatest(study);
  const runWhileStudying = (action: StudyShortcutAction) => () => {
    const currentStudy = latestStudy.current;
    if (currentStudy.status === "studying") void currentStudy[action]();
  };

  // useKey retains its initial handler, so that handler reads current Feature state through one stable ref.
  useKey("ArrowUp", runWhileStudying("swipeUp"));
  useKey("ArrowDown", runWhileStudying("swipeDown"));
  useKey("ArrowLeft", runWhileStudying("swipeLeft"));
  useKey("ArrowRight", runWhileStudying("swipeRight"));
  useKey("Enter", runWhileStudying("toggleBackText"));
  useKey("h", runWhileStudying("toggleHeader"));
  useKey("b", runWhileStudying("toggleSwipeButtonList"));
  useKey(" ", runWhileStudying("toggleAutoPlay"));

  React.useEffect(() => {
    if (study.status !== "invalid") return;
    void navigation.to(routes.deckList.to(), { replace: true });
  }, [navigation, study.status]);

  return renderStudyScreen(study);
};

export const StudySessionPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  return (
    <RouteEntityBoundary entity="Deck" id={deckId} title="Study session unavailable.">
      {/* Study state belongs to one route Deck, so id changes start a fresh Feature lifecycle. */}
      <StudySessionContent key={deckId} deckId={deckId} />
    </RouteEntityBoundary>
  );
};
