import type * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { DeckFilterForm, useDeckFilterState } from "@/features/deck-filter";
import { routes, useNavigation } from "@/features/navigate";
import { StudySessionStartView, useStudySessionStartState } from "@/features/study-session-start";
import { AppLayout } from "@/widgets/app-layout";
import { RouteEntityBoundary } from "@/widgets/route-entity-boundary";

// The Enter shortcut listens at the window level, so interactive controls must own the event.
const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

const StudySessionStartContent = ({ deckId }: { deckId: string }) => {
  const navigation = useNavigation();
  const state = useStudySessionStartState(deckId);
  const deckFilter = useDeckFilterState(deckId);
  const start = () => {
    state.onStart();
    void navigation.to(routes.deckStudy.to(deckId), { replace: true });
  };
  const startFromEnter = (event: KeyboardEvent) => {
    if (state.cardsLength === 0 || hasInteractiveShortcutTarget(event.target)) return;
    start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return (
    <AppLayout showHeader>
      <StudySessionStartView
        deckName={state.deckName}
        maxNumberOfCardsToLearn={state.maxNumberOfCardsToLearn}
        cardsLength={state.cardsLength}
        onClickStart={start}
        filterSlot={<DeckFilterForm {...deckFilter} tags={state.tags} />}
      />
    </AppLayout>
  );
};

export const StudySessionStartPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  return (
    <RouteEntityBoundary entity="Deck" id={deckId}>
      {/* Session setup state belongs to one route Deck and must reset when the id changes. */}
      <StudySessionStartContent key={deckId} deckId={deckId} />
    </RouteEntityBoundary>
  );
};
