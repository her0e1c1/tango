import type { Deck } from "@/entities/deck";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useCards } from "@/features/card/read";
import { BackText, CardOverlay, FrontText } from "@/features/card/view";
import { useDecks } from "@/features/deck/read";
import { useStudyScreen } from "@/features/study";
import { combineRemoteReadStates } from "@/shared/lib/remote-read";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { AppLayout } from "@/widgets/app-layout";

import { DeckSwiperView } from "./DeckSwiperView";

const STUDY_HISTORY_GUARD = "tangoStudyDeckId";
const isHistoryState = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

type CardRemote = ReturnType<typeof useCards>;
type CombinedReadState = ReturnType<typeof combineRemoteReadStates>;

const DeckSwiperContent = ({
  cardRemote,
  deck,
  readState,
}: {
  cardRemote: CardRemote;
  deck: Deck;
  readState: CombinedReadState;
}) => {
  const navigate = useNavigate();
  const deckId = deck.id;
  const study = useStudyScreen({
    cardsById: cardRemote.cardsById,
    deck,
    readsReady: readState.status === "ready",
    onUnavailable: () => void navigate("/", { replace: true }),
  });

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

  if (study.card == null) {
    return (
      <RemoteReadBoundary
        status={readState.status}
        hasData={false}
        emptyLabel="Study session unavailable."
        onRetry={readState.retry}
      >
        {null}
      </RemoteReadBoundary>
    );
  }

  return (
    <AppLayout fullscreen scroll={study.showBackText} showHeader={study.showHeader}>
      <DeckSwiperView
        showController={study.showController}
        showBackText={study.showBackText}
        showSwipeButtonList={study.showSwipeButtonList}
        {...(study.swipeFeedback === undefined ? {} : { swipeFeedback: study.swipeFeedback })}
        frontTextSlot={
          <FrontText
            {...(study.category === undefined ? {} : { category: study.category })}
            text={study.card.frontText}
            onSwipeUp={study.actions.swipeUp}
            onSwipeDown={study.actions.swipeDown}
            onSwipeLeft={study.actions.swipeLeft}
            onSwipeRight={study.actions.swipeRight}
            onClick={study.actions.toggleShowBackText}
          />
        }
        cardOverlaySlot={<CardOverlay card={study.card} />}
        backTextSlot={
          <BackText
            {...(study.backText.category === undefined ? {} : { category: study.backText.category })}
            code={study.backText.code}
            dark={study.backText.dark}
            text={study.card.backText}
            onClick={study.actions.toggleShowBackText}
          />
        }
        controller={study.controller}
        swipeButtonList={study.swipeActions}
        swipeOverlay={study.swipeActions}
      />
    </AppLayout>
  );
};

export const DeckSwiperPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const remote = useDecks();
  const cardRemote = useCards();
  const readState = combineRemoteReadStates(cardRemote, remote);
  const deck = remote.decksById[deckId];

  return (
    <RemoteReadBoundary
      status={readState.status}
      hasData={deck != null}
      emptyLabel="Study session unavailable."
      onRetry={readState.retry}
    >
      {deck != null ? <DeckSwiperContent cardRemote={cardRemote} deck={deck} readState={readState} /> : null}
    </RemoteReadBoundary>
  );
};
