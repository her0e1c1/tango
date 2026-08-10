import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { DeckStartForm, useDeckActions, useDeckFilterState } from "@/features/deck";
import { useStudyActions } from "@/features/study";
import { useActions } from "@/hooks/useActions";
import { useConfig } from "@/hooks/useConfig";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { DeckStartView } from "./DeckStartView";

const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

export const DeckStartContent = (props: { deck: Deck; cards: Card[]; config: ConfigState; tags: string[] }) => {
  const { deck, cards, config, tags } = props;
  const deckActions = useDeckActions(deck.id);
  const studyActions = useStudyActions(deck.id);
  const startStudy = studyActions.start;
  const actions = useActions();
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.update });
  const startFromEnter = (event: KeyboardEvent) => {
    if (cards.length === 0 || hasInteractiveShortcutTarget(event.target)) return;
    startStudy();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return (
    <DeckStartView
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickImport: actions.goToImport,
          onClickSettings: actions.goToSettings,
        },
      }}
      deckName={deck.name}
      maxNumberOfCardsToLearn={config.maxNumberOfCardsToLearn}
      cardsLength={cards.length}
      onClickStart={startStudy}
      filterSlot={<DeckStartForm {...deckStartForm} />}
    />
  );
};

export const DeckStartPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deckId");
  const config = useConfig();
  const remote = useRemoteCollections();
  const deck = remote.deckById(deckId);
  const cards = remote.filteredCardsByDeckId(deckId, config);
  const tags = remote.tagsByDeckId(deckId);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={deck != null}
      emptyContent={
        <RouteFeedback
          title="Deck not found"
          description="The requested deck is unavailable or has been removed."
          tone="not-found"
          primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
          secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
        />
      }
      onRetry={remote.retry}
    >
      {deck != null ? <DeckStartContent deck={deck} cards={cards} config={config} tags={tags} /> : null}
    </RemoteReadBoundary>
  );
};
