import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { filterCardsByDeckId, useCards } from "@/entities/card";
import { deleteDeck, mustFindDeckById, type Deck, useDecks } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { showToast } from "@/shared/ui/toast";

interface DeckDeletionTarget {
  deck: Deck;
  cardCount: number;
}

interface UseDeckDeletionOptions {
  onDeleted?: () => void;
}

export const useDeckDeletion = ({ onDeleted }: UseDeckDeletionOptions = {}) => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const isMounted = useMountedGuard();
  const [target, setTarget] = React.useState<DeckDeletionTarget>();
  const [pending, setPending] = React.useState(false);

  const request = (id: Deck["id"]) => {
    if (pending) return;
    const deck = mustFindDeckById(decks, id);
    setTarget({ deck, cardCount: filterCardsByDeckId(cards, id).length });
  };

  const cancel = () => {
    if (!pending) setTarget(undefined);
  };

  const confirm = async () => {
    if (target == null || pending) return;
    const { deck } = target;

    setPending(true);
    try {
      await deleteDeck(uid, deck.id);
      if (!isMounted()) return;
      setTarget(undefined);
      showToast({ message: `Deleted deck “${deck.name}”.`, tone: "success" });
      onDeleted?.();
    } catch {
      if (isMounted()) {
        // A failed attempt ends with the dialog closed; retry starts from a newly selected Deck.
        setTarget(undefined);
        showToast({
          message: "Unable to delete this deck. Check your connection and try again.",
          tone: "error",
        });
      }
    } finally {
      if (isMounted()) setPending(false);
    }
  };

  return {
    target:
      target == null
        ? undefined
        : {
            deckName: target.deck.name,
            cardCount: target.cardCount,
          },
    request,
    cancel,
    confirm,
    pending,
  };
};
