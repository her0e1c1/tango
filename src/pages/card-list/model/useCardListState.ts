import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { deleteCard, mustFindCardById, type Card, type CardId, useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { editStudyProgress } from "@/entities/study-progress";
import { selectStudyCards } from "@/entities/study-session";

interface CardListItem {
  id: CardId;
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

export interface CardListState {
  tags: string[];
  cards: CardListItem[];
  answer: CardListAnswer | undefined;
  deletionTarget: { frontText: string; hasError: boolean } | undefined;
  mutationError: unknown;
  successMessage: string | undefined;
  onShowCard: (id: CardId) => void;
  onCloseCard: () => void;
  onSwipedLeft: (id: CardId) => void;
  onSwipedRight: (id: CardId) => void;
  onRequestDeletion: (id: CardId) => void;
  onCancelDeletion: () => void;
  onConfirmDeletion: () => Promise<void>;
}

const buildCardListItem = (card: Card): CardListItem => ({
  id: card.id,
  frontText: card.frontText,
  score: card.score,
  numberOfSeen: card.numberOfSeen,
  tags: card.tags,
});

export const useCardListState = (deck: Deck): CardListState => {
  const uid = useAuthUid();
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);
  const [shownCard, setShownCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [deletionErrorCardId, setDeletionErrorCardId] = React.useState<CardId>();
  const [mutationError, setMutationError] = React.useState<unknown>(null);
  const [successMessage, setSuccessMessage] = React.useState<string>();

  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);

  const changeScore = (id: CardId, offset: number) => {
    const card = mustFindCardById(cards, id);
    void editStudyProgress(uid, { cardId: card.id, score: card.score + offset })
      .then(() => setMutationError(null))
      .catch(setMutationError);
  };

  const requestDeletion = (id: CardId) => {
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
          dark: preferences.appearance.darkMode,
        };

  return {
    tags,
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
    onShowCard: (id: CardId) => setShownCard(mustFindCardById(cards, id)),
    onCloseCard: () => setShownCard(undefined),
    onSwipedLeft: (id: CardId) => changeScore(id, -1),
    onSwipedRight: (id: CardId) => changeScore(id, 1),
    onRequestDeletion: requestDeletion,
    onCancelDeletion: () => setDeletionTarget(undefined),
    onConfirmDeletion: confirmDeletion,
  };
};
