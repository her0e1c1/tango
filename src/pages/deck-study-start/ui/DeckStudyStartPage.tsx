import type { Card } from "@/entities/card";
import { type Deck, filterCardsForDeck, useDeck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import type * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { useCardsByDeckId } from "@/entities/card";
import { usePreferences } from "@/entities/preferences";
import { startStudy } from "@/entities/study-session";
import { DeckFilterForm, useDeckFilterState } from "@/features/deck-filter";
import { StudySessionStartView } from "@/features/study-session-start";
import { routes, useNavigation } from "@/shared/routes";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

// The Enter shortcut below listens at the window level, so key events from focused controls bubble
// into it. Keep those controls in sole ownership of Enter; otherwise activating a filter or header
// control could also start a study session, and activating the Start button could run it twice.
// `closest` also covers events whose target is a child rendered inside an interactive control.
const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

const DeckStudyStartContent = (props: { deck: Deck; cards: Card[]; preferences: Preferences; tags: string[] }) => {
  const { deck, cards, preferences, tags } = props;
  const navigation = useNavigation();
  const deckFilter = useDeckFilterState(deck);
  const start = () => {
    startStudy(deck.id, cards, preferences.study);
    void navigation.to(routes.deckStudy.to(deck.id), { replace: true });
  };
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
        filterSlot={<DeckFilterForm {...deckFilter} tags={tags} />}
      />
    </AppLayout>
  );
};

export const DeckStudyStartPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");
  const preferences = usePreferences();
  const deck = useDeck(deckId);
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const cards = deck == null ? [] : filterCardsForDeck(deckCards, deck, preferences.study);

  if (deck == null) {
    return (
      <RouteFeedback
        title="Deck not found"
        description="The requested deck is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
        secondaryAction={{ label: "Go back", onClick: () => void navigation.back() }}
      />
    );
  }

  return <DeckStudyStartContent deck={deck} cards={cards} preferences={preferences} tags={tags} />;
};
