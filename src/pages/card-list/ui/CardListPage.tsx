import type { ConfigState } from "@/entities/config";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import type { Card, CardId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { useCardMutations } from "@/features/card";
import { DeckStartForm, useDeckActions, useDeckFilterState } from "@/features/deck";
import { useActions } from "@/features/app-controls";
import { useConfig } from "@/entities/config";
import { useRemoteCollections } from "@/features/remote-collections";
import { filterCardsForDeck } from "@/features/study";
import { getContentCategory, LANGUAGES } from "@/shared/lib/content-category";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { CardListView } from "./CardListView";

const CardListContent = (props: { deck: Deck; cards: Card[]; tags: string[]; config: ConfigState }) => {
  const { deck, cards, tags, config } = props;
  const [showCard, setShowCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [deletionErrorCardId, setDeletionErrorCardId] = React.useState<CardId>();
  const [successMessage, setSuccessMessage] = React.useState<string>();
  const actions = useActions();
  const mutations = useCardMutations({
    cardById: (id) => cards.find((card) => card.id === id),
    onRemoveSuccess: (card) => {
      setDeletionTarget((target) => (target?.id === card.id ? undefined : target));
      setDeletionErrorCardId((id) => (id === card.id ? undefined : id));
      setSuccessMessage(`Deleted card “${card.frontText}”.`);
    },
  });
  const deckActions = useDeckActions(deck);
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckActions.update });
  const closeCard = () => setShowCard(undefined);
  const category = showCard == null ? undefined : getContentCategory(deck.category, showCard.tags);

  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);

  return (
    <CardListView
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
                code: LANGUAGES.includes(category),
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

export const CardListPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const config = useConfig();
  const remote = useRemoteCollections();
  const deck = remote.deckById(deckId);
  const cards = deck == null ? [] : filterCardsForDeck(remote.cardsByDeckId(deckId), deck, config, remote.now);
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
