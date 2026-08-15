import type { Card } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { useCardsByDeckId } from "@/entities/card";
import { DeckStartForm, useDeckFilterState } from "@/features/deck-start";
import { useStudyActions, useStudyCards } from "@/features/study";
import { usePreferences } from "@/entities/preferences";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { isInteractiveShortcutTarget } from "@/shared/lib/isInteractiveShortcutTarget";
import { AppLayout } from "@/widgets/app-layout";

import { DeckStartView } from "./DeckStartView";

const DeckStartContent = (props: { deck: Deck; cards: Card[]; preferences: Preferences; tags: string[] }) => {
  const { deck, cards, preferences, tags } = props;
  const navigate = useNavigate();
  const studyActions = useStudyActions(deck.id, {
    onStarted: () => void navigate(`/deck/${deck.id}/study`, { replace: true }),
  });
  const deckStartForm = useDeckFilterState({ deck, tags });
  const start = () => studyActions.start(cards);
  const startFromEnter = (event: KeyboardEvent) => {
    if (cards.length === 0 || isInteractiveShortcutTarget(event.target)) return;
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
  const deck = useDeck(deckId);
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const cards = useStudyCards(deck, deckCards, preferences);

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

  return <DeckStartContent deck={deck} cards={cards} preferences={preferences} tags={tags} />;
};
