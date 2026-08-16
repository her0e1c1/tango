import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { deleteCard, mustFindCardById, type Card, type CardId } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck } from "@/entities/deck";
import { editStudyProgress } from "@/entities/study-progress";

export interface CardListItem {
  id: string;
  frontText: string;
  score: number;
  numberOfSeen: number;
  tags: string[];
}

interface CardListAnswer {
  text: string;
  category: string;
  code: boolean;
  dark: boolean;
}

interface UseCardListStateOptions {
  cards: Card[];
  deck: Deck;
  dark: boolean;
}

const buildCardListItem = (card: Card): CardListItem => ({
  id: card.id,
  frontText: card.frontText,
  score: card.score,
  numberOfSeen: card.numberOfSeen,
  tags: card.tags,
});

export const useCardListState = ({ cards, deck, dark }: UseCardListStateOptions) => {
  const uid = useAuthUid();
  const [shownCard, setShownCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [deletionErrorCardId, setDeletionErrorCardId] = React.useState<CardId>();
  const [mutationError, setMutationError] = React.useState<unknown>(null);
  const [successMessage, setSuccessMessage] = React.useState<string>();

  const changeScore = (id: string, offset: number) => {
    const card = mustFindCardById(cards, id);
    void editStudyProgress(uid, { cardId: card.id, score: card.score + offset })
      .then(() => setMutationError(null))
      .catch(setMutationError);
  };

  const requestDeletion = (id: string) => {
    const card = mustFindCardById(cards, id);
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

  const category = shownCard == null ? undefined : getCategory(deck.category, shownCard.tags);
  const answer: CardListAnswer | undefined =
    shownCard == null || category == null
      ? undefined
      : {
          text: shownCard.backText,
          category,
          code: isHighlightLanguage(category),
          dark,
        };

  return {
    cards: cards.map(buildCardListItem),
    answer,
    deletionTarget:
      deletionTarget == null
        ? undefined
        : {
            frontText: deletionTarget.frontText,
            hasError: deletionErrorCardId === deletionTarget.id,
          },
    mutationError,
    successMessage,
    onShowCard: (id: string) => setShownCard(mustFindCardById(cards, id)),
    onCloseCard: () => setShownCard(undefined),
    onSwipedLeft: (id: string) => changeScore(id, -1),
    onSwipedRight: (id: string) => changeScore(id, 1),
    onRequestDeletion: requestDeletion,
    onCancelDeletion: () => setDeletionTarget(undefined),
    onConfirmDeletion: confirmDeletion,
  };
};
