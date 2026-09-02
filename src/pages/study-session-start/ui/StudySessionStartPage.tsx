import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useKey } from "react-use";

import type { Deck } from "@/entities/deck";
import { useDeck } from "@/entities/deck";
import { useDeckFilterState } from "@/features/deck-filter";
import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useStudySessionStartState } from "../model/useStudySessionStartState";
import { StudySessionFilters } from "./StudySessionFilters";
import { StudySessionStart } from "./StudySessionStart";

// The Enter shortcut listens at the window level, so interactive controls must own the event.
const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

const AvailableStudySessionStartPage: React.FC<{ deck: Deck }> = ({ deck }) => {
  const navigate = useNavigate();
  const filter = useDeckFilterState(deck);
  // Session selection previews the local filter draft before the user chooses whether to save it.
  const state = useStudySessionStartState({
    ...deck,
    difficultyMax: filter.difficultyMax,
    difficultyMin: filter.difficultyMin,
    selectedTags: filter.selectedTags,
    tagAndFilter: filter.tagAndFilter,
  });
  const start = () => {
    state.onStart();
    void navigate(routes.deckStudy.to(deck.id), { replace: true });
  };
  const startFromEnter = (event: KeyboardEvent) => {
    if (filter.saving || state.cardsLength === 0 || hasInteractiveShortcutTarget(event.target)) return;
    start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return (
    <AppLayout showHeader>
      <StudySessionStart
        deckName={state.deckName}
        maxNumberOfCardsToLearn={state.maxNumberOfCardsToLearn}
        cardsLength={state.cardsLength}
        disabled={filter.saving}
        onClickStart={start}
        filterSlot={<StudySessionFilters {...filter} tags={state.tags} />}
      />
    </AppLayout>
  );
};

export const StudySessionStartPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");
  const deck = useDeck(deckId);

  if (deck == null) {
    return (
      <RouteNotFound
        title={t("studyStart.deckNotFound.title")}
        description={t("studyStart.deckNotFound.description")}
      />
    );
  }

  // Session setup state belongs to one route Deck and must reset when the id changes.
  return <AvailableStudySessionStartPage key={deckId} deck={deck} />;
};
