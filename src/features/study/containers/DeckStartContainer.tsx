/**
 * @file Connects application state and operations to the study feature's Deck Start Container
 * view.
 * The container prepares route data and callbacks, then delegates visual rendering to presentation
 * components.
 */

import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary, RouteFeedback } from "@/components";
import { DeckStartForm } from "@/features/deck/components/DeckStartForm";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { useDeckFilterState } from "@/features/deck/hooks/useDeckFilterState";
import { DeckStartTemplate } from "@/features/study/components/templates/DeckStartTemplate";
import { useStudyActions } from "@/features/study/hooks/useStudyActions";
import { useActions } from "@/hooks/useActions";
import { useConfig } from "@/hooks/useConfig";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";

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
  const actions = useActions();
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.updateFilter });
  useGlobalShortcut("Enter", startStudy, cards.length > 0);

  return (
    <DeckStartTemplate
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      deckName={deck.name}
      maxNumberOfCardsToLearn={config.maxNumberOfCardsToLearn}
      cardsLength={cards.length}
      onClickStart={startStudy}
      feedbackSlot={
        <RemoteMutationNotice
          pending={deckActions.pending}
          error={deckActions.error}
          onRetry={deckActions.retry}
          pendingLabel="Saving filters…"
          errorLabel="Unable to save filters."
        />
      }
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
