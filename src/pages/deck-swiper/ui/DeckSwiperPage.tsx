import { getCategory, type Deck, useDeck } from "@/entities/deck";

import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCards } from "@/entities/card";
import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import { StudyWorkflow, type ActiveStudyWorkflowState } from "@/features/study";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { DeckSwiperView } from "./DeckSwiperView";

const renderStudyScreen = (deck: Deck, state: ActiveStudyWorkflowState) => {
  const category = getCategory(deck.category, state.card.tags);

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
            onSwipeUp={state.actions.swipeUp}
            onSwipeDown={state.actions.swipeDown}
            onSwipeLeft={state.actions.swipeLeft}
            onSwipeRight={state.actions.swipeRight}
            onClick={state.actions.toggleShowBackText}
          />
        }
        cardOverlaySlot={<CardOverlay card={state.card} />}
        backTextSlot={
          <CardView card={state.card} deck={deck} onClick={state.actions.toggleShowBackText} variant="bare" />
        }
        controller={state.controller}
        swipeButtonList={state.swipeActions}
        swipeOverlay={state.swipeActions}
      />
    </AppLayout>
  );
};

const DeckSwiperContent = ({ cards, deck }: { cards: Card[]; deck: Deck }) => {
  const navigate = useNavigate();

  return (
    <StudyWorkflow
      key={deck.id}
      cards={cards}
      deckId={deck.id}
      deckName={deck.name}
      onExit={(deckId) => void navigate(`/deck/${deckId}`, { replace: true })}
      onSetupStudy={(deckId) => void navigate(`/deck/${deckId}/start`)}
      onBackToDeck={(deckId) => void navigate(`/deck/${deckId}`, { replace: true })}
    >
      {(state) => renderStudyScreen(deck, state)}
    </StudyWorkflow>
  );
};

export const DeckSwiperPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const cards = useCards();
  const deck = useDeck(deckId);

  if (deck == null) {
    return (
      <RouteFeedback
        title="Deck not found"
        description="The requested deck is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
      />
    );
  }

  return <DeckSwiperContent key={deck.id} cards={cards} deck={deck} />;
};
