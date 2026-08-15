import { getCategory, type Deck, useDeck } from "@/entities/deck";
import { toggleShowHeader, toggleShowSwipeButtonList } from "@/entities/preferences";

import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type Card, useCards } from "@/entities/card";
import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import { DeckSwiperView, type StudyState, useStudy } from "@/features/study";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const renderStudyScreen = (deck: Deck, state: StudyState) => {
  if (state.status !== "studying") {
    return state.status === "loading" ? (
      <RouteFeedback title="Loading…" tone="loading" />
    ) : (
      <RouteFeedback title="Study session unavailable." tone="not-found" />
    );
  }

  const category = getCategory(deck.category, state.card.tags);
  const swipeActions = {
    disabled: false,
    onClickUp: state.swipeUp,
    onClickDown: state.swipeDown,
    onClickLeft: state.swipeLeft,
    onClickRight: state.swipeRight,
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
            category={category}
            text={state.card.frontText}
            onSwipeUp={state.swipeUp}
            onSwipeDown={state.swipeDown}
            onSwipeLeft={state.swipeLeft}
            onSwipeRight={state.swipeRight}
            onClick={state.toggleBackText}
          />
        }
        cardOverlaySlot={<CardOverlay card={state.card} />}
        backTextSlot={<CardView card={state.card} deck={deck} onClick={state.toggleBackText} variant="bare" />}
        controller={{
          autoPlay: state.autoPlay,
          index: state.session.currentIndex,
          numberOfCards: state.session.cardOrderIds.length,
          onChange: state.updateIndex,
          onToggleAutoPlay: state.toggleAutoPlay,
        }}
        swipeButtonList={swipeActions}
        swipeOverlay={swipeActions}
      />
    </AppLayout>
  );
};

const DeckStudyScreen = ({ deck, state }: { deck: Deck; state: StudyState }) => {
  useKey("ArrowUp", state.swipeUp);
  useKey("ArrowDown", state.swipeDown);
  useKey("ArrowLeft", state.swipeLeft);
  useKey("ArrowRight", state.swipeRight);
  useKey("Enter", state.toggleBackText);
  useKey("h", toggleShowHeader);
  useKey("b", toggleShowSwipeButtonList);
  useKey(" ", state.toggleAutoPlay);

  return renderStudyScreen(deck, state);
};

const DeckStudyContent = ({ cards, deck }: { cards: Card[]; deck: Deck }) => {
  const navigate = useNavigate();
  const handleUnavailable = () => {
    void navigate("/", { replace: true });
  };
  const study = useStudy(deck.id, cards, handleUnavailable);

  return <DeckStudyScreen deck={deck} state={study} />;
};

export const DeckStudyPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  const cards = useCards();
  const deck = useDeck(deckId);

  if (deck == null) {
    return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  }

  return <DeckStudyContent key={deck.id} cards={cards} deck={deck} />;
};
