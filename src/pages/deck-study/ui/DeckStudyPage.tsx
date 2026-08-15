import { getCategory, type Deck, useDeck } from "@/entities/deck";
import { toggleShowHeader, toggleShowSwipeButtonList } from "@/entities/preferences";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type Card, useCards } from "@/entities/card";
import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import { DeckSwiperView, StudyWorkflow, type StudyWorkflowState } from "@/features/study";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

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
          <CardView card={state.card} deck={deck} onClick={state.actions.toggleShowBackText} variant="bare" />
        }
        controller={state.controller}
        swipeButtonList={state.swipeActions}
        swipeOverlay={state.swipeActions}
      />
    </AppLayout>
  );
};

const DeckStudyScreen = ({ deck, state }: { deck: Deck; state: StudyWorkflowState }) => {
  useKey("ArrowUp", state.shortcutActions.swipeUp);
  useKey("ArrowDown", state.shortcutActions.swipeDown);
  useKey("ArrowLeft", state.shortcutActions.swipeLeft);
  useKey("ArrowRight", state.shortcutActions.swipeRight);
  useKey("Enter", state.shortcutActions.toggleShowBackText);
  useKey("h", toggleShowHeader);
  useKey("b", toggleShowSwipeButtonList);
  useKey(" ", state.shortcutActions.toggleAutoPlay);

  return renderStudyScreen(deck, state);
};

const DeckStudyContent = ({ cards, deck }: { cards: Card[]; deck: Deck }) => {
  const navigate = useNavigate();
  useStudyHistoryGuard(deck.id, navigate);
  const handleUnavailable = React.useCallback(() => {
    void navigate("/", { replace: true });
  }, [navigate]);

  return (
    <StudyWorkflow key={deck.id} cards={cards} deckId={deck.id} onUnavailable={handleUnavailable}>
      {(state) => <DeckStudyScreen deck={deck} state={state} />}
    </StudyWorkflow>
  );
};

export const DeckStudyPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const cards = useCards();
  const deck = useDeck(deckId);

  if (deck == null) {
    return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  }

  return <DeckStudyContent key={deck.id} cards={cards} deck={deck} />;
};
