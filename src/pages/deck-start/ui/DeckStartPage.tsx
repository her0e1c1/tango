import type { Card } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { useCardsByDeckId } from "@/entities/card";
import { usePreferences } from "@/entities/preferences";
import { DeckFilterForm, useDeckFilterState, useFilteredStudyCards } from "@/features/deck-filter";
import { StudySessionStartView, useStartStudySession } from "@/features/study-session-start";
import { discardPromise } from "@/shared/lib/discardPromise";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

const DeckStartContent = (props: { deck: Deck; cards: Card[]; preferences: Preferences; tags: string[] }) => {
  const { deck, cards, preferences, tags } = props;
  const navigate = useNavigate();
  const startStudy = useStartStudySession(deck.id, {
    onStarted: () => {
      discardPromise(navigate(`/deck/${deck.id}/study`, { replace: true }));
    },
  });
  const deckFilterForm = useDeckFilterState({ deck, tags });
  const start = () => startStudy(cards);
  const startFromEnter = (event: KeyboardEvent) => {
    if (cards.length === 0 || hasInteractiveShortcutTarget(event.target)) return;
    start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return (
    <AppLayout showHeader>
      <StudySessionStartView
        deckName={deck.name}
        maxNumberOfCardsToLearn={preferences.study.maxNumberOfCardsToLearn}
        cardsLength={cards.length}
        onClickStart={start}
        filterSlot={<DeckFilterForm {...deckFilterForm} />}
      />
    </AppLayout>
  );
};

export const DeckStartPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");
  const preferences = usePreferences();
  const deck = useDeck(deckId);
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const cards = useFilteredStudyCards(deck, deckCards, preferences);

  if (deck == null) {
    return (
      <RouteFeedback
        title="Deck not found"
        description="The requested deck is unavailable or has been removed."
        tone="not-found"
        primaryAction={{
          label: "Go home",
          onClick: () => {
            discardPromise(navigate("/"));
          },
        }}
        secondaryAction={{
          label: "Go back",
          onClick: () => {
            discardPromise(navigate(-1));
          },
        }}
      />
    );
  }

  return <DeckStartContent deck={deck} cards={cards} preferences={preferences} tags={tags} />;
};
