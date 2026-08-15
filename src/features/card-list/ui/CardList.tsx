import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { deleteCard, mustFindCardById, type Card, type CardId } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import { editStudyProgress } from "@/entities/study-progress";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";

import { CardListView } from "./CardListView";

interface CardListFilter {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  controls: React.ReactNode;
  onChangeSelectedTags: (tags: string[]) => void;
}

interface CardListBackTextProps {
  text: string;
  category?: string;
  code?: boolean;
  dark?: boolean;
}

export interface CardListProps {
  deck: Deck;
  cards: Card[];
  preferences: Preferences;
  filter: CardListFilter;
  renderBackText: (props: CardListBackTextProps) => React.ReactNode;
  onEditCard: (id: CardId) => void;
}

export const CardList: React.FC<CardListProps> = (props) => {
  const uid = useAuthUid();
  const [shownCard, setShownCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [deletionErrorCardId, setDeletionErrorCardId] = React.useState<CardId>();
  const [mutationError, setMutationError] = React.useState<unknown>(null);
  const [successMessage, setSuccessMessage] = React.useState<string>();

  const changeScore = (id: CardId, offset: number) => {
    const card = mustFindCardById(props.cards, id);
    void editStudyProgress(uid, { cardId: card.id, score: card.score + offset })
      .then(() => setMutationError(null))
      .catch(setMutationError);
  };

  const requestDeletion = (id: CardId) => {
    const card = mustFindCardById(props.cards, id);
    setSuccessMessage(undefined);
    setDeletionErrorCardId(undefined);
    setDeletionTarget(card);
  };

  const confirmDeletion = async () => {
    if (deletionTarget == null) return;
    const card = deletionTarget;
    setDeletionErrorCardId(undefined);
    try {
      await deleteCard(uid, card);
      setDeletionTarget(undefined);
      setSuccessMessage(`Deleted card “${card.frontText}”.`);
    } catch {
      setDeletionErrorCardId(card.id);
    }
  };

  const category = shownCard == null ? undefined : getCategory(props.deck.category, shownCard.tags);

  return (
    <>
      <Feedback tone="error">{mutationError == null ? null : "Unable to save changes. Try again."}</Feedback>
      <Feedback tone="success">{successMessage}</Feedback>
      {deletionTarget != null ? (
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
          onConfirm={confirmDeletion}
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
        onRemoveTag={(tag) =>
          props.filter.onChangeSelectedTags(props.filter.selectedTags.filter((value) => value !== tag))
        }
        card={{
          onSwipedLeft: (id) => changeScore(id, -1),
          onSwipedRight: (id) => changeScore(id, 1),
          goToEdit: props.onEditCard,
          onDelete: requestDeletion,
        }}
        {...(shownCard != null && category != null
          ? {
              overlay: {
                content: props.renderBackText({
                  text: shownCard.backText,
                  category,
                  code: isHighlightLanguage(category),
                  dark: props.preferences.appearance.darkMode,
                }),
                onClose: () => setShownCard(undefined),
              },
            }
          : {})}
        onShowCard={setShownCard}
      />
    </>
  );
};
