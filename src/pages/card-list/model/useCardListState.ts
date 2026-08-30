import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { deleteCard, mustFindCardById, type Card, type CardId, useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { editStudyProgress } from "@/entities/study-progress";
import { selectStudyCards } from "@/entities/study-session";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

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
  deletionTarget: { frontText: string } | undefined;
  deletionPending: boolean;
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

const dismissOwnedToast = (toastId: React.RefObject<ToastId | undefined>) => {
  const id = toastId.current;
  if (id === undefined) return;
  dismissToast(id);
  toastId.current = undefined;
};

interface ScoreErrorToast {
  cardId: CardId;
  toastId: ToastId;
}

export const useCardListState = (deck: Deck): CardListState => {
  const uid = useAuthUid();
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);
  const isMounted = useMountedGuard();
  const [shownCard, setShownCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [deletionPending, setDeletionPending] = React.useState(false);
  const deletionPendingRef = React.useRef(false);
  const deletionErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const scoreErrorToast = React.useRef<ScoreErrorToast | undefined>(undefined);
  const scoreMutationSequences = React.useRef(new Map<CardId, number>());

  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);

  const dismissDeletionErrorToast = () => dismissOwnedToast(deletionErrorToastId);
  const dismissScoreErrorToast = (cardId?: CardId) => {
    const ownedToast = scoreErrorToast.current;
    if (ownedToast === undefined || (cardId !== undefined && ownedToast.cardId !== cardId)) return;
    dismissToast(ownedToast.toastId);
    scoreErrorToast.current = undefined;
  };

  const nextScoreMutationSequence = (cardId: CardId) => {
    const sequence = (scoreMutationSequences.current.get(cardId) ?? 0) + 1;
    scoreMutationSequences.current.set(cardId, sequence);
    return sequence;
  };

  const isLatestScoreMutation = (cardId: CardId, sequence: number) =>
    scoreMutationSequences.current.get(cardId) === sequence;

  React.useEffect(
    () => () => {
      dismissOwnedToast(deletionErrorToastId);
      dismissScoreErrorToast();
    },
    []
  );

  const changeScore = (id: CardId, offset: number) => {
    const card = mustFindCardById(cards, id);
    // Writes for one Card supersede only that Card so another Card's late failure remains actionable.
    const sequence = nextScoreMutationSequence(card.id);
    dismissScoreErrorToast(card.id);
    void editStudyProgress(uid, { cardId: card.id, score: card.score + offset })
      .then(() => {
        if (isMounted() && isLatestScoreMutation(card.id, sequence)) dismissScoreErrorToast(card.id);
      })
      .catch(() => {
        if (isMounted() && isLatestScoreMutation(card.id, sequence)) {
          scoreErrorToast.current = {
            cardId: card.id,
            toastId: showToast({ message: "Unable to save changes. Try again.", tone: "error" }),
          };
        }
      });
  };

  const requestDeletion = (id: CardId) => {
    // A closed pending dialog must not let another Card replace the target captured by the issued write.
    // biome-ignore lint/suspicious/noUnnecessaryConditions: The pending write mutates this ref outside the request callback's render.
    if (deletionPendingRef.current) return;
    const card = mustFindCardById(cards, id);
    dismissDeletionErrorToast();
    setDeletionTarget(card);
  };

  const confirmDeletion = async () => {
    if (deletionTarget == null || deletionPendingRef.current) return;
    const card = deletionTarget;
    dismissDeletionErrorToast();
    deletionPendingRef.current = true;
    setDeletionPending(true);
    try {
      await deleteCard(uid, card);
      if (!isMounted()) return;
      // Only a committed deletion supersedes pending score writes for that Card; a failed deletion leaves them actionable.
      nextScoreMutationSequence(card.id);
      dismissScoreErrorToast(card.id);
      setDeletionTarget(undefined);
      showToast({ message: `Deleted card “${card.frontText}”.`, tone: "success" });
    } catch {
      if (isMounted()) {
        deletionErrorToastId.current = showToast({
          message: "Unable to delete this card. Check your connection and try again.",
          tone: "error",
        });
      }
    } finally {
      deletionPendingRef.current = false;
      if (isMounted()) setDeletionPending(false);
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
    deletionPending,
    deletionTarget:
      deletionTarget == null
        ? undefined
        : {
            frontText: deletionTarget.frontText,
          },
    onShowCard: (id: CardId) => setShownCard(mustFindCardById(cards, id)),
    onCloseCard: () => setShownCard(undefined),
    onSwipedLeft: (id: CardId) => changeScore(id, -1),
    onSwipedRight: (id: CardId) => changeScore(id, 1),
    onRequestDeletion: requestDeletion,
    onCancelDeletion: () => {
      // Closing the dialog only dismisses its UI; an already-issued deletion owns its eventual global Toast.
      dismissDeletionErrorToast();
      setDeletionTarget(undefined);
    },
    onConfirmDeletion: confirmDeletion,
  };
};
