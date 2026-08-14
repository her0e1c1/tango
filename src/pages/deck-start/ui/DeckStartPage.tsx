import type { Card, CardId } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { filterCardsByDeckId, filterTagsByDeckId } from "@/entities/card";
import { useCards } from "@/features/card/read";
import { useEditDeck } from "@/features/deck/edit";
import { DeckStartForm, useDeckFilterState, useStudyActions, useStudyCards } from "@/features/study";
import { usePreferences } from "@/entities/preferences";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

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
  const deckMutations = useEditDeck();
  const navigate = useNavigate();
  const studyActions = useStudyActions(deck.id, {
    cardsById,
    onStarted: () => void navigate(`/deck/${deck.id}/study`, { replace: true }),
  });
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckMutations.update });
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
  const cardRemote = useCards();
  const deck = useDeck(deckId);
  const deckCards = React.useMemo(() => filterCardsByDeckId(cardRemote.cards, deckId), [cardRemote.cards, deckId]);
  const cards = useStudyCards(deck, deckCards, preferences);
  const tags = filterTagsByDeckId(cardRemote.cards, deckId);

  return (
    <RemoteReadBoundary
      status={cardRemote.status}
      hasData={cardRemote.status === "ready" && deck != null}
      emptyContent={
        <RouteFeedback
          title="Deck not found"
          description="The requested deck is unavailable or has been removed."
          tone="not-found"
          primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
          secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
        />
      }
      onRetry={cardRemote.retry}
    >
      {deck != null ? (
        <DeckStartContent
          cardsById={cardRemote.cardsById}
          deck={deck}
          cards={cards}
          preferences={preferences}
          tags={tags}
        />
      ) : null}
    </RemoteReadBoundary>
  );
};
