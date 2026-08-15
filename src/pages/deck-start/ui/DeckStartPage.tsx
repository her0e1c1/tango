import type { Card, CardId } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { filterCardsByDeckId, filterTagsByDeckId, useCards } from "@/entities/card";
import { useStudyActions, useStudyCards } from "@/features/study";
import { usePreferences } from "@/entities/preferences";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";
import { toRemoteById } from "@/shared/lib/remoteSnapshot";

import { useDeckFilterState } from "../model/useDeckFilterState";
import { DeckStartForm } from "./DeckStartForm";
import { DeckStartView } from "./DeckStartView";

const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

const DeckStartContent = (props: {
  cardsById: Partial<Record<CardId, Card>>;
  deck: Deck;
  cards: Card[];
  preferences: Preferences;
  tags: string[];
}) => {
  const { cardsById, deck, cards, preferences, tags } = props;
  const navigate = useNavigate();
  const studyActions = useStudyActions(deck.id, {
    cardsById,
    onStarted: () => void navigate(`/deck/${deck.id}/study`, { replace: true }),
  });
  const deckStartForm = useDeckFilterState({ deck, tags });
  const start = () => studyActions.start(cards);
  const startFromEnter = (event: KeyboardEvent) => {
    if (cards.length === 0 || hasInteractiveShortcutTarget(event.target)) return;
    start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return (
    <AppLayout showHeader>
      <DeckStartView
        deckName={deck.name}
        maxNumberOfCardsToLearn={preferences.study.maxNumberOfCardsToLearn}
        cardsLength={cards.length}
        onClickStart={start}
        filterSlot={<DeckStartForm {...deckStartForm} />}
      />
    </AppLayout>
  );
};

export const DeckStartPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const preferences = usePreferences();
  const allCards = useCards();
  const cardsById = React.useMemo(() => toRemoteById(allCards), [allCards]);
  const deck = useDeck(deckId);
  const deckCards = React.useMemo(() => filterCardsByDeckId(allCards, deckId), [allCards, deckId]);
  const cards = useStudyCards(deck, deckCards, preferences);
  const tags = filterTagsByDeckId(allCards, deckId);

  if (deck == null) {
    return (
      <RouteFeedback
        title="Deck not found"
        description="The requested deck is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
        secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
      />
    );
  }

  return <DeckStartContent cardsById={cardsById} deck={deck} cards={cards} preferences={preferences} tags={tags} />;
};
