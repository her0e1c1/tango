import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { deleteCard, mustFindCardById, type Card, type CardId, useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { calculateDifficulty, editStudyProgress, type StudyRating } from "@/entities/study-progress";
import { selectStudyCards } from "@/entities/study-session";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

interface CardListItem {
  id: CardId;
  frontText: string;
  difficulty: number;
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
  mutationPending: boolean;
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
  difficulty: card.difficulty,
  numberOfSeen: card.numberOfSeen,
  tags: card.tags,
});

export const useCardListState = (deck: Deck): CardListState => {
  const uid = useAuthUid();
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);
  const isMounted = useMountedGuard();
  const [shownCard, setShownCard] = React.useState<Card>();
  const [deletionTarget, setDeletionTarget] = React.useState<Card>();
  const [mutationPending, setMutationPending] = React.useState(false);
  const mutationPendingRef = React.useRef(false);
  const errorToastId = React.useRef<ToastId | undefined>(undefined);

  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);

  const dismissErrorToast = () => {
    if (errorToastId.current === undefined) return;
    dismissToast(errorToastId.current);
    errorToastId.current = undefined;
  };

  React.useEffect(() => () => dismissErrorToast(), []);

  const beginMutation = () => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: Separate same-tick list gestures can run before React disables the rows.
    if (mutationPendingRef.current) return false;
    dismissErrorToast();
    mutationPendingRef.current = true;
    setMutationPending(true);
    return true;
  };

  const finishMutation = () => {
    mutationPendingRef.current = false;
    if (isMounted()) setMutationPending(false);
  };

  const changeDifficulty = async (id: CardId, rating: StudyRating) => {
    if (!beginMutation()) return;
    const card = mustFindCardById(cards, id);
    try {
      await editStudyProgress(uid, {
        cardId: card.id,
        difficulty: calculateDifficulty(card.difficulty, rating),
      });
    } catch {
      if (isMounted()) {
        errorToastId.current = showToast({ message: "Unable to save changes. Try again.", tone: "error" });
      }
    } finally {
      finishMutation();
    }
  };

  const requestDeletion = (id: CardId) => {
    dismissErrorToast();
    setDeletionTarget(mustFindCardById(cards, id));
  };

  const confirmDeletion = async () => {
    if (deletionTarget == null || !beginMutation()) return;
    const card = deletionTarget;
    try {
      await deleteCard(uid, card);
      if (!isMounted()) return;
      setDeletionTarget(undefined);
      showToast({ message: `Deleted card “${card.frontText}”.`, tone: "success" });
    } catch {
      if (isMounted()) {
        // A failed attempt ends with the dialog closed; retry starts from a newly selected Card.
        setDeletionTarget(undefined);
        errorToastId.current = showToast({
          message: "Unable to delete this card. Check your connection and try again.",
          tone: "error",
        });
      }
    } finally {
      finishMutation();
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
    mutationPending,
    deletionPending: mutationPending && deletionTarget != null,
    deletionTarget:
      deletionTarget == null
        ? undefined
        : {
            frontText: deletionTarget.frontText,
          },
    onShowCard: (id: CardId) => setShownCard(mustFindCardById(cards, id)),
    onCloseCard: () => setShownCard(undefined),
    onSwipedLeft: (id: CardId) => void changeDifficulty(id, "not-mastered"),
    onSwipedRight: (id: CardId) => void changeDifficulty(id, "mastered"),
    onRequestDeletion: requestDeletion,
    onCancelDeletion: () => setDeletionTarget(undefined),
    onConfirmDeletion: confirmDeletion,
  };
};
