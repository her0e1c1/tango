import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { deleteCard, mustFindCardById, type Card, type CardId, useCardsByDeckId } from "@/entities/card";
import {
  type Deck,
  editDeck,
  getCategory,
  isDeckTagSelectionMatching,
  isHighlightLanguage,
  useDeck,
} from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { createStudyProgressFromCard, editStudyProgress, isStudyProgressEligible } from "@/entities/study-progress";

type DeckFilterValues = Pick<Deck, "scoreMax" | "scoreMin" | "selectedTags" | "tagAndFilter">;

export interface CardListItem {
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
  /** Lets presentation distinguish an empty Deck from a filter with zero matches. */
  rawCardsLength: number;
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

// Keeps multi-Entity selection in the use-case owner while each Entity supplies only its own pure rule.
const selectStudyCards = (cards: Card[], deck: Deck, useCardInterval: boolean, now = Date.now()): Card[] =>
  cards.filter(
    (card) =>
      isDeckTagSelectionMatching(card.tags, deck) &&
      isStudyProgressEligible(
        createStudyProgressFromCard(card),
        {
          maximumScore: deck.scoreMax,
          minimumScore: deck.scoreMin,
          respectNextSeeingAt: useCardInterval,
        },
        now
      )
  );

export const useCardListState = (deckId: string) => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const [filter, setFilter] = React.useState<DeckFilterValues>();
  const [shownCard, setShownCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [deletionErrorCardId, setDeletionErrorCardId] = React.useState<CardId>();
  const [mutationError, setMutationError] = React.useState<unknown>(null);
  const [successMessage, setSuccessMessage] = React.useState<string>();

  if (deck == null) return;

  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);
  const storedFilter: DeckFilterValues = {
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
  };
  const updateFilter = <Key extends keyof DeckFilterValues>(key: Key, value: DeckFilterValues[Key]) => {
    setFilter((current) => ({ ...(current ?? storedFilter), [key]: value }));
    void editDeck(uid, { id: deck.id, [key]: value }).catch(() => undefined);
  };

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
    filter: {
      ...(filter ?? storedFilter),
      setScoreMax: (value: number | null) => updateFilter("scoreMax", value),
      setScoreMin: (value: number | null) => updateFilter("scoreMin", value),
      setSelectedTags: (value: string[]) => updateFilter("selectedTags", value),
      setTagAndFilter: (value: boolean) => updateFilter("tagAndFilter", value),
    },
    tags,
    rawCardsLength: deckCards.length,
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
