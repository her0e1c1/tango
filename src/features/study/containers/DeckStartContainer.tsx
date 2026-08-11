/**
 * @file Connects application state and operations to the study feature's Deck Start Container
 * view.
 * The container prepares route data and callbacks, then delegates visual rendering to presentation
 * components.
 */

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { ConfigState } from "@/shared/config";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { selectCardsForDeck, selectTagsForDeck, useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { DeckStartForm } from "@/features/deck/components/DeckStartForm";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { useDeckFilterState } from "@/features/deck/hooks/useDeckFilterState";
import { DeckStartTemplate } from "@/features/study/components/templates/DeckStartTemplate";
import { useStudyActions } from "@/features/study/hooks/useStudyActions";
import { useStudyCards } from "@/features/study/hooks/useStudyCards";
import { setDarkMode, useConfig } from "@/shared/config";

/**
 * Checks whether the supplied value satisfies the interactive shortcut target condition.
 * A named predicate makes the decision rule reusable and easier to recognize at each call site.
 */
const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

/**
 * Connects the Deck Start Content view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
export const DeckStartContent = (props: { deck: Deck; cards: Card[]; config: ConfigState; tags: string[] }) => {
  const { deck, cards, config, tags } = props;
  const deckId = deck.id;
  const deckActions = useDeckActions(deckId);
  const studyActions = useStudyActions(deckId);
  const startStudy = studyActions.start;
  const navigate = useNavigate();
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.update });
  /**
   * Starts the study session when Enter is pressed outside an interactive control.
   * The guard prevents the shortcut from stealing Enter presses intended for buttons or form
   * fields.
   */
  const startFromEnter = (event: KeyboardEvent) => {
    if (cards.length === 0 || hasInteractiveShortcutTarget(event.target)) return;
    startStudy();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return (
    <DeckStartTemplate
      layout={{
        headerProps: {
          dark: config.appearance.darkMode,
          onClickDarkMode: setDarkMode,
          onClickLogo: () => void navigate("/"),
          onClickImport: () => void navigate("/import"),
          onClickSettings: () => void navigate("/settings"),
        },
      }}
      deckName={deck.name}
      maxNumberOfCardsToLearn={config.study.maxNumberOfCardsToLearn}
      cardsLength={cards.length}
      onClickStart={startStudy}
      filterSlot={<DeckStartForm {...deckStartForm} />}
    />
  );
};

/**
 * Connects the Deck Start Container view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
export const DeckStartContainer: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deckId");
  const config = useConfig();
  const cardRemote = useCards();
  const remote = useDecks();
  const deck = remote.decksById[deckId];
  const deckCards = React.useMemo(() => selectCardsForDeck(cardRemote.cards, deckId), [cardRemote.cards, deckId]);
  const cards = useStudyCards(deck, deckCards, config);
  const tags = selectTagsForDeck(cardRemote.cards, deckId);

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
