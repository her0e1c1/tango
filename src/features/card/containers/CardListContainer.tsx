/**
 * @file Connects application state and operations to the card feature's Card List Container view.
 * The container prepares route data and callbacks, then delegates visual rendering to presentation
 * components.
 */

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import * as C from "@/constant";
import * as util from "@/util";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import {
  DestructiveActionDialog,
  Feedback,
  RemoteMutationNotice,
  RemoteReadBoundary,
  RouteFeedback,
} from "@/components";
import { useActions } from "@/hooks/useActions";
import { CardListTemplate } from "@/features/card/components/templates/CardListTemplate";
import { DeckStartForm } from "@/features/deck/components/DeckStartForm";
import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { useDeckFilterState } from "@/features/deck/hooks/useDeckFilterState";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useConfig } from "@/hooks/useConfig";

/**
 * Connects the Card List Content view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
const CardListContent = (props: { deck: Deck; cards: Card[]; tags: string[]; config: ConfigState }) => {
  const { deck, cards, tags, config } = props;
  const deckId = deck.id;
  const [showCard, setShowCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [deletionErrorCardId, setDeletionErrorCardId] = React.useState<CardId>();
  const [successMessage, setSuccessMessage] = React.useState<string>();
  const actions = useActions();
  const mutations = useCardMutations({
    onRemoveSuccess: (card) => {
      setDeletionTarget((target) => (target?.id === card.id ? undefined : target));
      setDeletionErrorCardId((id) => (id === card.id ? undefined : id));
      setSuccessMessage(`Deleted card “${card.frontText}”.`);
    },
  });
  const deckActions = useDeckActions(deckId);
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.update });
  /**
   * Closes the currently selected card preview.
   * Clearing the selection returns the list container to its unexpanded state.
   */
  const closeCard = () => setShowCard(undefined);
  const category = showCard == null ? undefined : util.getCategory(deck.category, showCard.tags);

  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);

  return (
    <CardListTemplate
      cards={cards}
      filter={{
        scoreMax: deckStartForm.scoreMax,
        scoreMin: deckStartForm.scoreMin,
        selectedTags: deckStartForm.tagFilterProps.selectedTags ?? [],
      }}
      filterSlot={<DeckStartForm {...deckStartForm} />}
      onRemoveTag={(tag) => {
        const selectedTags = deckStartForm.tagFilterProps.selectedTags ?? [];
        deckStartForm.tagFilterProps.onClickTag?.(selectedTags.filter((value) => value !== tag));
      }}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickImport: actions.goToImport,
          onClickSettings: actions.goToSettings,
        },
      }}
      card={{
        onSwipedLeft: (id) => void mutations.updateBy(id, (card) => ({ score: card.score - 1 })).catch(() => undefined),
        onSwipedRight: (id) =>
          void mutations.updateBy(id, (card) => ({ score: card.score + 1 })).catch(() => undefined),
        goToEdit: actions.goToCardEdit,
        onDelete: (id) => {
          const card = cards.find((candidate) => candidate.id === id);
          if (card != null) {
            setSuccessMessage(undefined);
            setDeletionErrorCardId(undefined);
            setDeletionTarget(card);
          }
        },
      }}
      feedbackSlot={
        <>
          <RemoteMutationNotice
            pending={mutations.pending}
            error={mutations.error}
            onRetry={mutations.retry}
            {...(deletionTarget != null ? { pendingLabel: "Deleting card…" } : {})}
          />
          <Feedback tone="success">{successMessage}</Feedback>
        </>
      }
      dialogSlot={
        deletionTarget != null ? (
          <DestructiveActionDialog
            title="Delete card?"
            targetLabel="Card front"
            targetName={deletionTarget.frontText}
            description={
              <>
                <p>This permanently deletes this card.</p>
                <p>This action cannot be undone.</p>
              </>
            }
            confirmLabel="Delete card"
            pending={mutations.isPending(deletionTarget.id)}
            {...(deletionErrorCardId === deletionTarget.id
              ? { errorMessage: "Unable to delete this card. Check your connection and try again." }
              : {})}
            onCancel={() => setDeletionTarget(undefined)}
            onConfirm={() =>
              mutations.remove(deletionTarget.id).catch(() => {
                setDeletionErrorCardId(deletionTarget.id);
              })
            }
          />
        ) : null
      }
      isCardPending={mutations.isPending}
      {...(showCard != null && category != null
        ? {
            overlay: {
              backText: {
                text: showCard.backText,
                category,
                code: C.LANGUAGES.includes(category),
                dark: config.darkMode,
              },
              onClose: closeCard,
            },
          }
        : {})}
      onShowCard={setShowCard}
    />
  );
};

/**
 * Connects the Card List Container view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
export const CardListContainer: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
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
      {deck != null ? <CardListContent deck={deck} cards={cards} tags={tags} config={config} /> : null}
    </RemoteReadBoundary>
  );
};
