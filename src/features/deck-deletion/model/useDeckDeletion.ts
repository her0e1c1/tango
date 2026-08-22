import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { filterCardsByDeckId, useCards } from "@/entities/card";
import { deleteDeck, mustFindDeckById, type Deck, useDecks } from "@/entities/deck";

interface DeckDeletionTarget {
  deck: Deck;
  cardCount: number;
}

export interface DeckDeletionTargetView {
  deckName: string;
  cardCount: number;
  hasError: boolean;
}

interface UseDeckDeletionOptions {
  onDeleted?: () => void;
}

export const useDeckDeletion = ({ onDeleted }: UseDeckDeletionOptions = {}) => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const [target, setTarget] = React.useState<DeckDeletionTarget>();
  const [hasError, setHasError] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string>();

  const request = (id: Deck["id"]) => {
    const deck = mustFindDeckById(decks, id);
    setSuccessMessage(undefined);
    setHasError(false);
    setTarget({ deck, cardCount: filterCardsByDeckId(cards, id).length });
  };

  const cancel = () => setTarget(undefined);

  const confirm = async () => {
    if (target == null) return;

    setHasError(false);
    try {
      await deleteDeck(uid, target.deck.id);
      setTarget(undefined);
      setSuccessMessage(`Deleted deck “${target.deck.name}”.`);
      onDeleted?.();
    } catch {
      // Keep the target open so a transient write failure can be retried without losing user intent.
      setHasError(true);
    }
  };

  return {
    target:
      target == null
        ? undefined
        : {
            deckName: target.deck.name,
            cardCount: target.cardCount,
            hasError,
          },
    successMessage,
    request,
    cancel,
    confirm,
  };
};
