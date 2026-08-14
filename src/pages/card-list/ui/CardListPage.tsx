import type { ConfigState } from "@/shared/config";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type Card, type CardId, filterCardsByDeckId, filterTagsByDeckId } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck, useDeck } from "@/entities/deck";
import { useDeleteCard } from "@/features/card/delete";
import { useCards } from "@/features/card/read";
import { useEditDeck } from "@/features/deck/edit";
import { useDeckRead } from "@/features/deck/read";
import {
  DeckStartForm,
  type StudyProgressPatch,
  useDeckFilterState,
  useEditStudyProgress,
  useStudyCards,
} from "@/features/study";
import { useConfig } from "@/shared/config";
import { combineRemoteReadStates } from "@/shared/lib/remote-read";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { CardListView } from "./CardListView";

const CardListContent = (props: { deck: Deck; cards: Card[]; tags: string[]; config: ConfigState }) => {
  const { deck, cards, tags, config } = props;
  const [showCard, setShowCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [deletionErrorCardId, setDeletionErrorCardId] = React.useState<CardId>();
  const [mutationError, setMutationError] = React.useState<unknown>(null);
  const [successMessage, setSuccessMessage] = React.useState<string>();
  const navigate = useNavigate();
  const editMutation = useEditStudyProgress();
  const deleteMutation = useDeleteCard({
    onSuccess: (card) => {
      setDeletionTarget((target) => (target?.id === card.id ? undefined : target));
      setDeletionErrorCardId((id) => (id === card.id ? undefined : id));
      setSuccessMessage(`Deleted card “${card.frontText}”.`);
    },
  });
  const deckMutations = useEditDeck();
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit: deckMutations.update });
  const closeCard = () => setShowCard(undefined);
  const category = showCard == null ? undefined : getCategory(deck.category, showCard.tags);
  const updateBy = (id: CardId, buildPatch: (card: Card) => StudyProgressPatch) => {
    const card = cards.find((candidate) => candidate.id === id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return editMutation.updateBy(card, buildPatch);
  };

  useKey("t", () => void navigate("/"));
  useKey("s", () => void navigate("/settings"));

  return (
    <AppLayout showHeader>
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
        card={{
          onSwipedLeft: (id) =>
            void updateBy(id, (card) => ({ score: card.score - 1 }))
              .then(() => setMutationError(null))
              .catch(setMutationError),
          onSwipedRight: (id) =>
            void updateBy(id, (card) => ({ score: card.score + 1 }))
              .then(() => setMutationError(null))
              .catch(setMutationError),
          goToEdit: (id) => void navigate(`/card/${id}/edit`),
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
            <Feedback tone="error">{mutationError == null ? null : "Unable to save changes. Try again."}</Feedback>
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
              {...(deletionErrorCardId === deletionTarget.id
                ? { errorMessage: "Unable to delete this card. Check your connection and try again." }
                : {})}
              onCancel={() => setDeletionTarget(undefined)}
              onConfirm={() => {
                setDeletionErrorCardId(undefined);
                return deleteMutation.remove(deletionTarget).catch(() => {
                  setDeletionErrorCardId(deletionTarget.id);
                });
              }}
            />
          ) : null
        }
        {...(showCard != null && category != null
          ? {
              overlay: {
                backText: {
                  text: showCard.backText,
                  category,
                  code: isHighlightLanguage(category),
                  dark: config.appearance.darkMode,
                },
                onClose: closeCard,
              },
            }
          : {})}
        onShowCard={setShowCard}
      />
    </AppLayout>
  );
};

export const CardListPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const config = useConfig();
  const cardRemote = useCards();
  const remote = useDeckRead();
  const readState = combineRemoteReadStates(cardRemote, remote);
  const deck = useDeck(deckId);
  const deckCards = React.useMemo(() => filterCardsByDeckId(cardRemote.cards, deckId), [cardRemote.cards, deckId]);
  const cards = useStudyCards(deck, deckCards, config);
  const tags = filterTagsByDeckId(cardRemote.cards, deckId);

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
      {deck != null ? <CardListContent deck={deck} cards={cards} tags={tags} config={config} /> : null}
    </RemoteReadBoundary>
  );
};
