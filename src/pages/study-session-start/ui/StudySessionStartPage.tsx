import type * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { DeckFilterForm } from "@/features/deck-filter";
import { routes, useNavigation } from "@/features/navigate";
import { StudySessionStartView, useStudySessionStartState } from "@/features/study-session-start";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

// The Enter shortcut listens at the window level, so interactive controls must own the event.
const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

const StudySessionStartContent = ({ deckId }: { deckId: string }) => {
  const navigation = useNavigation();
  const state = useStudySessionStartState(deckId);
  const start = () => {
    state?.onStart();
    void navigation.to(routes.deckStudy.to(deckId), { replace: true });
  };
  const startFromEnter = (event: KeyboardEvent) => {
    if (state == null || state.cardsLength === 0 || hasInteractiveShortcutTarget(event.target)) return;
    start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  if (state == null) {
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

  return (
    <AppLayout showHeader>
      <StudySessionStartView
        deckName={state.deckName}
        maxNumberOfCardsToLearn={state.maxNumberOfCardsToLearn}
        cardsLength={state.cardsLength}
        onClickStart={start}
        filterSlot={<DeckFilterForm {...state.filter} tags={state.tags} />}
      />
    </AppLayout>
  );
};

export const StudySessionStartPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  // Session setup state belongs to one route Deck and must reset when the id changes.
  return <StudySessionStartContent key={deckId} deckId={deckId} />;
};
