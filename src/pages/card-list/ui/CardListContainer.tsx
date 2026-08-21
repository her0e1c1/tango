import type * as React from "react";

import { type Deck, useDeck } from "@/entities/deck";
import { BackText } from "@/features/card-view";
import { DeckFilterForm, useDeckFilterState } from "@/features/deck-filter";
import { routes, useNavigation } from "@/features/navigate";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardListState } from "../model/useCardListState";
import { CardList } from "./CardList";

const AvailableCardListContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
  const navigation = useNavigation();
  const deckFilter = useDeckFilterState(deck);
  // Card selection must use optimistic filter values before their persistence request completes.
  const state = useCardListState({
    ...deck,
    scoreMax: deckFilter.scoreMax,
    scoreMin: deckFilter.scoreMin,
    selectedTags: deckFilter.selectedTags,
    tagAndFilter: deckFilter.tagAndFilter,
  });

  return (
    <AppLayout showHeader>
      <Feedback tone="error">{state.mutationError == null ? null : "Unable to save changes. Try again."}</Feedback>
      <Feedback tone="success">{state.successMessage}</Feedback>
      {state.deletionTarget != null ? (
        <DestructiveActionDialog
          title="Delete card?"
          targetLabel="Card front"
          targetName={state.deletionTarget.frontText}
          description={
            <>
              <p>This permanently deletes this card.</p>
              <p>This action cannot be undone.</p>
            </>
          }
          confirmLabel="Delete card"
          {...(state.deletionTarget.hasError
            ? { errorMessage: "Unable to delete this card. Check your connection and try again." }
            : {})}
          onCancel={state.onCancelDeletion}
          onConfirm={state.onConfirmDeletion}
        />
      ) : null}
      <CardList
        cards={state.cards}
        filter={{
          scoreMax: deckFilter.scoreMax,
          scoreMin: deckFilter.scoreMin,
          selectedTags: deckFilter.selectedTags,
        }}
        filterSlot={<DeckFilterForm {...deckFilter} tags={state.tags} />}
        onRemoveTag={(tag) =>
          deckFilter.setSelectedTags(deckFilter.selectedTags.filter((selectedTag) => selectedTag !== tag))
        }
        card={{
          onSwipedLeft: state.onSwipedLeft,
          onSwipedRight: state.onSwipedRight,
          goToEdit: (id) => void navigation.to(routes.cardForm.to(id)),
          onDelete: state.onRequestDeletion,
        }}
        {...(state.answer != null
          ? {
              overlay: {
                content: <BackText {...state.answer} />,
                onClose: state.onCloseCard,
              },
            }
          : {})}
        onShowCard={state.onShowCard}
      />
    </AppLayout>
  );
};

export const CardListContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const deck = useDeck(deckId);

  if (deck == null) {
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

  return <AvailableCardListContainer deck={deck} />;
};
