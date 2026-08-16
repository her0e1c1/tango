import * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import { routes, useNavigation } from "@/features/navigate";
import { DeckSwiperView, type StudyState, useStudy } from "@/features/study";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

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
  const runWhileStudying = (action: () => unknown) => () => {
    if (study.status === "studying") void action();
  };

  useKey("ArrowUp", runWhileStudying(study.swipeUp));
  useKey("ArrowDown", runWhileStudying(study.swipeDown));
  useKey("ArrowLeft", runWhileStudying(study.swipeLeft));
  useKey("ArrowRight", runWhileStudying(study.swipeRight));
  useKey("Enter", runWhileStudying(study.toggleBackText));
  useKey("h", runWhileStudying(study.toggleHeader));
  useKey("b", runWhileStudying(study.toggleSwipeButtonList));
  useKey(" ", runWhileStudying(study.toggleAutoPlay));

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

  // Study state belongs to one route Deck, so id changes start a fresh Feature lifecycle.
  return <StudySessionContent key={deckId} deckId={deckId} />;
};
