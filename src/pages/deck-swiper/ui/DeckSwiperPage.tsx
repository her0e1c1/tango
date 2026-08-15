import { getCategory, type Deck, useDeck } from "@/entities/deck";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCards } from "@/entities/card";
import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import { StudyWorkflow, type StudyWorkflowState } from "@/features/study";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { DeckSwiperView } from "./DeckSwiperView";

const STUDY_HISTORY_GUARD = "tangoStudyDeckId";
const isHistoryState = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

const useStudyHistoryGuard = (deckId: string, navigate: ReturnType<typeof useNavigate>) => {
  // Keep the active study session on the route when browser history moves backward.
  React.useEffect(() => {
    const currentState: unknown = window.history.state;
    const state = isHistoryState(currentState) ? currentState : {};
    if (state[STUDY_HISTORY_GUARD] !== deckId) {
      window.history.pushState({ ...state, [STUDY_HISTORY_GUARD]: deckId }, document.title, document.location.href);
    }
    const handlePopState = () => {
      void navigate(1);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [deckId, navigate]);
};

const renderStudyScreen = (deck: Deck, state: StudyWorkflowState) => {
  if (state.status !== "ready") {
    return state.status === "loading" ? (
      <RouteFeedback title="Loading…" tone="loading" />
    ) : (
      <RouteFeedback title="Study session unavailable." tone="not-found" />
    );
  }

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
          <CardView
            card={state.card}
            deck={deck}
            onClick={state.actions.toggleShowBackText}
            variant="bare"
          />
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
  useStudyHistoryGuard(deck.id, navigate);
  const handleUnavailable = React.useCallback(() => {
    void navigate("/", { replace: true });
  }, [navigate]);

  return (
    <StudyWorkflow key={deck.id} cards={cards} deckId={deck.id} onUnavailable={handleUnavailable}>
      {(state) => renderStudyScreen(deck, state)}
    </StudyWorkflow>
  );
};

export const DeckSwiperPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const cards = useCards();
  const deck = useDeck(deckId);

  if (deck == null) {
    return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  }

  return <DeckSwiperContent key={deck.id} cards={cards} deck={deck} />;
};
