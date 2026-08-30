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
  const scoreErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const scoreMutationSequence = React.useRef(0);

  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);

  const dismissDeletionErrorToast = () => dismissOwnedToast(deletionErrorToastId);
  const dismissScoreErrorToast = () => dismissOwnedToast(scoreErrorToastId);

  React.useEffect(
    () => () => {
      dismissOwnedToast(deletionErrorToastId);
      dismissOwnedToast(scoreErrorToastId);
    },
    []
  );

  const changeScore = (id: CardId, offset: number) => {
    const card = mustFindCardById(cards, id);
    // Overlapping swipes can settle out of order; only the latest write may own application-wide feedback.
    scoreMutationSequence.current += 1;
    const sequence = scoreMutationSequence.current;
    dismissScoreErrorToast();
    void editStudyProgress(uid, { cardId: card.id, score: card.score + offset })
      .then(() => {
        if (isMounted() && sequence === scoreMutationSequence.current) dismissScoreErrorToast();
      })
      .catch(() => {
        if (isMounted() && sequence === scoreMutationSequence.current) {
          scoreErrorToastId.current = showToast({ message: "Unable to save changes. Try again.", tone: "error" });
        }
      });
  };

  const requestDeletion = (id: CardId) => {
    const card = mustFindCardById(cards, id);
    dismissDeletionErrorToast();
    setDeletionTarget(card);
  };

  const confirmDeletion = async () => {
    if (deletionTarget == null || deletionPendingRef.current) return;
    const card = deletionTarget;
    dismissDeletionErrorToast();
    // A later delete result owns feedback over any older score write for the same list.
    scoreMutationSequence.current += 1;
    dismissScoreErrorToast();
    deletionPendingRef.current = true;
    setDeletionPending(true);
    try {
      await deleteCard(uid, card);
      if (!isMounted()) return;
      setDeletionTarget(undefined);
      showToast({ message: `Deleted card “${card.frontText}”.`, tone: "success" });
    } catch {
      if (isMounted()) {
        deletionErrorToastId.current = showToast({
          message: "Unable to delete this card. Check your connection and try again.",
          tone: "error",
          dismissible: false,
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
      // biome-ignore lint/suspicious/noUnnecessaryConditions: Cancel may run after confirm mutates this React ref.
      if (deletionPendingRef.current) return;
      dismissDeletionErrorToast();
      setDeletionTarget(undefined);
    },
    onConfirmDeletion: confirmDeletion,
  };
};
