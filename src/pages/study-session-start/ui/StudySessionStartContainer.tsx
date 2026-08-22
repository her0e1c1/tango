import type * as React from "react";
import { useKey } from "react-use";

import type { Deck } from "@/entities/deck";
import { useDeck } from "@/entities/deck";
import { DeckFilterForm, useDeckFilterState } from "@/features/deck-filter";
import { routes, useNavigation } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useStudySessionStartState } from "../model/useStudySessionStartState";
import { StudySessionStart } from "./StudySessionStart";

// The Enter shortcut listens at the window level, so interactive controls must own the event.
const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

const AvailableStudySessionStartContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
  const navigation = useNavigation();
  const filter = useDeckFilterState(deck);
  // Session selection must see optimistic filter state before its persistence request completes.
  const state = useStudySessionStartState({
    ...deck,
    scoreMax: filter.scoreMax,
    scoreMin: filter.scoreMin,
    selectedTags: filter.selectedTags,
    tagAndFilter: filter.tagAndFilter,
  });
  const start = () => {
    state.onStart();
    void navigation.to(routes.deckStudy.to(deck.id), { replace: true });
  };
  const startFromEnter = (event: KeyboardEvent) => {
    if (state.cardsLength === 0 || hasInteractiveShortcutTarget(event.target)) return;
    start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return (
    <AppLayout showHeader>
      <StudySessionStart
        deckName={state.deckName}
        maxNumberOfCardsToLearn={state.maxNumberOfCardsToLearn}
        cardsLength={state.cardsLength}
        onClickStart={start}
        filterSlot={<DeckFilterForm {...filter} tags={state.tags} />}
      />
    </AppLayout>
  );
};

export const StudySessionStartContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const deck = useDeck(deckId);

  if (deck == null) {
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

  return <AvailableStudySessionStartContainer deck={deck} />;
};
