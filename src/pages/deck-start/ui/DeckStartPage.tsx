import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { ConfigState } from "@/shared/config";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { selectCardsForDeck, selectTagsForDeck } from "@/entities/card";
import { useCards } from "@/features/card/read";
import { useEditDeck } from "@/features/deck/edit";
import { useDecks } from "@/features/deck/read";
import { DeckStartForm, useDeckFilterState, useStudyActions, useStudyCards } from "@/features/study";
import { useConfig } from "@/shared/config";
import { combineRemoteReadStates } from "@/shared/lib/remote-read";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { DeckStartView } from "./DeckStartView";

const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

type CardRead = Pick<ReturnType<typeof useCards>, "cards" | "cardsById">;

const DeckStartContent = (props: {
  cardRead: CardRead;
  deck: Deck;
  cards: Card[];
  config: ConfigState;
  tags: string[];
}) => {
  const { cardRead, deck, cards, config, tags } = props;
  const deckMutations = useEditDeck();
  const navigate = useNavigate();
  const studyActions = useStudyActions(deck.id, {
    cardRead,
    deck,
    onStarted: () => void navigate(`/deck/${deck.id}/study`, { replace: true }),
  });
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckMutations.update });
  const startFromEnter = (event: KeyboardEvent) => {
    if (cards.length === 0 || hasInteractiveShortcutTarget(event.target)) return;
    studyActions.start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return (
    <AppLayout showHeader>
      <DeckStartView
        deckName={deck.name}
        maxNumberOfCardsToLearn={config.study.maxNumberOfCardsToLearn}
        cardsLength={cards.length}
        onClickStart={studyActions.start}
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
  const config = useConfig();
  const cardRemote = useCards();
  const deckRemote = useDecks();
  const readState = combineRemoteReadStates(cardRemote, deckRemote);
  const deck = deckRemote.decksById[deckId];
  const deckCards = React.useMemo(() => selectCardsForDeck(cardRemote.cards, deckId), [cardRemote.cards, deckId]);
  const cards = useStudyCards(deck, deckCards, config);
  const tags = selectTagsForDeck(cardRemote.cards, deckId);

  return (
    <RemoteReadBoundary
      status={readState.status}
      hasData={readState.status === "ready" && deck != null}
      emptyContent={
        <RouteFeedback
          title="Deck not found"
          description="The requested deck is unavailable or has been removed."
          tone="not-found"
          primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
          secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
        />
      }
      onRetry={readState.retry}
    >
      {deck != null ? (
        <DeckStartContent cardRead={cardRemote} deck={deck} cards={cards} config={config} tags={tags} />
      ) : null}
    </RemoteReadBoundary>
  );
};
