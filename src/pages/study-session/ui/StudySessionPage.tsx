import { getCategory, type Deck, useDeck } from "@/entities/deck";
import { toggleShowHeader, toggleShowSwipeButtonList, usePreferences } from "@/entities/preferences";

import * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type Card, useCards } from "@/entities/card";
import { buildCardViewContent, CardOverlay, CardView, FrontText } from "@/features/card-view";
import { DeckSwiperView, type StudyState, useStudy } from "@/features/study";
import { routes, useNavigation } from "@/features/navigate";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const renderStudyScreen = (deck: Deck, state: StudyState, dark: boolean) => {
  if (state.status !== "studying") {
    return state.status === "preparing" ? (
      <RouteFeedback title="Loading…" tone="loading" />
    ) : (
      <RouteFeedback title="Study session unavailable." tone="not-found" />
    );
  }

  const category = getCategory(deck.category, state.card.tags);
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
            category={category}
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
        backTextSlot={
          <CardView {...buildCardViewContent(state.card, deck, dark)} onClick={state.toggleBackText} variant="bare" />
        }
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

const StudySessionScreen = ({ deck, state }: { deck: Deck; state: StudyState }) => {
  const preferences = usePreferences();
  useKey("ArrowUp", () => void state.swipeUp());
  useKey("ArrowDown", () => void state.swipeDown());
  useKey("ArrowLeft", () => void state.swipeLeft());
  useKey("ArrowRight", () => void state.swipeRight());
  useKey("Enter", state.toggleBackText);
  useKey("h", toggleShowHeader);
  useKey("b", toggleShowSwipeButtonList);
  useKey(" ", state.toggleAutoPlay);

  return renderStudyScreen(deck, state, preferences.appearance.darkMode);
};

const StudySessionContent = ({ cards, deck }: { cards: Card[]; deck: Deck }) => {
  const navigation = useNavigation();
  const study = useStudy(deck.id, cards);

  React.useEffect(() => {
    if (study.status !== "invalid") return;
    void navigation.to(routes.deckList.to(), { replace: true });
  }, [navigation, study.status]);

  return <StudySessionScreen deck={deck} state={study} />;
};

export const StudySessionPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  const cards = useCards();
  const deck = useDeck(deckId);

  if (deck == null) {
    return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  }

  return <StudySessionContent key={deck.id} cards={cards} deck={deck} />;
};
