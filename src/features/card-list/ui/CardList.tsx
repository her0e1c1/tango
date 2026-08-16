import type * as React from "react";

import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";

import type { CardListItem } from "../model/useCardListState";
import { CardListView } from "./CardListView";

interface CardListFilter {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  controls: React.ReactNode;
  onRemoveTag: (tag: string) => void;
}

interface CardListDeletionTarget {
  frontText: string;
  hasError: boolean;
}

export interface CardListProps {
  cards: CardListItem[];
  filter: CardListFilter;
  answerSlot?: React.ReactNode;
  deletionTarget?: CardListDeletionTarget;
  mutationError?: unknown;
  successMessage?: string;
  onShowCard: (id: string) => void;
  onCloseCard: () => void;
  onSwipedLeft: (id: string) => void;
  onSwipedRight: (id: string) => void;
  onEditCard: (id: string) => void;
  onRequestDeletion: (id: string) => void;
  onCancelDeletion: () => void;
  onConfirmDeletion: () => Promise<void>;
}

export const CardList: React.FC<CardListProps> = (props) => (
  <>
    <Feedback tone="error">{props.mutationError == null ? null : "Unable to save changes. Try again."}</Feedback>
    <Feedback tone="success">{props.successMessage}</Feedback>
    {props.deletionTarget != null ? (
      <DestructiveActionDialog
        title="Delete card?"
        targetLabel="Card front"
        targetName={props.deletionTarget.frontText}
        description={
          <>
            <p>This permanently deletes this card.</p>
            <p>This action cannot be undone.</p>
          </>
        }
        confirmLabel="Delete card"
        {...(props.deletionTarget.hasError
          ? { errorMessage: "Unable to delete this card. Check your connection and try again." }
          : {})}
        onCancel={props.onCancelDeletion}
        onConfirm={props.onConfirmDeletion}
      />
    ) : null}
    <CardListView
      cards={props.cards}
      filter={{
        scoreMax: props.filter.scoreMax,
        scoreMin: props.filter.scoreMin,
        selectedTags: props.filter.selectedTags,
      }}
      filterSlot={props.filter.controls}
      onRemoveTag={props.filter.onRemoveTag}
      card={{
        onSwipedLeft: props.onSwipedLeft,
        onSwipedRight: props.onSwipedRight,
        goToEdit: props.onEditCard,
        onDelete: props.onRequestDeletion,
      }}
      {...(props.answerSlot != null
        ? {
            overlay: {
              content: props.answerSlot,
              onClose: props.onCloseCard,
            },
          }
        : {})}
      onShowCard={props.onShowCard}
    />
  </>
);
