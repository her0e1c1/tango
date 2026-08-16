import type * as React from "react";

import type { CardId } from "@/entities/card";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";

import type { CardListState } from "../model/useCardListState";
import { CardListView } from "./CardListView";

interface CardListFilter {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  controls: React.ReactNode;
  onRemoveTag: (tag: string) => void;
}

export interface CardListProps {
  state: CardListState;
  filter: CardListFilter;
  answerSlot?: React.ReactNode;
  onEditCard: (id: CardId) => void;
}

export const CardList: React.FC<CardListProps> = (props) => {
  const { state } = props;

  return (
    <>
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
      <CardListView
        cards={state.cards}
        filter={{
          scoreMax: props.filter.scoreMax,
          scoreMin: props.filter.scoreMin,
          selectedTags: props.filter.selectedTags,
        }}
        filterSlot={props.filter.controls}
        onRemoveTag={props.filter.onRemoveTag}
        card={{
          onSwipedLeft: state.onSwipedLeft,
          onSwipedRight: state.onSwipedRight,
          goToEdit: props.onEditCard,
          onDelete: state.onRequestDeletion,
        }}
        {...(props.answerSlot != null
          ? {
              overlay: {
                content: props.answerSlot,
                onClose: state.onCloseCard,
              },
            }
          : {})}
        onShowCard={state.onShowCard}
      />
    </>
  );
};
