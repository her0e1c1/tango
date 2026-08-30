import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { filterCardsByDeckId, useCards } from "@/entities/card";
import { deleteDeck, mustFindDeckById, type Deck, useDecks } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

interface DeckDeletionTarget {
  deck: Deck;
  cardCount: number;
}

interface UseDeckDeletionOptions {
  onDeleted?: () => void;
}

const dismissOwnedToast = (toastId: React.RefObject<ToastId | undefined>) => {
  const id = toastId.current;
  if (id === undefined) return;
  dismissToast(id);
  toastId.current = undefined;
};

export const useDeckDeletion = ({ onDeleted }: UseDeckDeletionOptions = {}) => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const isMounted = useMountedGuard();
  const [target, setTarget] = React.useState<DeckDeletionTarget>();
  const [pending, setPending] = React.useState(false);
  const pendingRef = React.useRef(false);
  const errorToastId = React.useRef<ToastId | undefined>(undefined);

  const dismissErrorToast = () => dismissOwnedToast(errorToastId);

  React.useEffect(() => () => dismissOwnedToast(errorToastId), []);

  const request = (id: Deck["id"]) => {
    // One issued deletion owns this model until it settles; a hidden dialog must not be retargeted meanwhile.
    // biome-ignore lint/suspicious/noUnnecessaryConditions: The pending write mutates this ref outside the request callback's render.
    if (pendingRef.current) return;
    const deck = mustFindDeckById(decks, id);
    dismissErrorToast();
    setTarget({ deck, cardCount: filterCardsByDeckId(cards, id).length });
  };

  const cancel = () => {
    dismissErrorToast();
    setTarget(undefined);
  };

  const confirm = async () => {
    if (target == null || pendingRef.current) return;
    const { deck } = target;

    dismissErrorToast();
    // The captured Deck keeps the issued write and its Toast outcome alive if Close releases the modal.
    pendingRef.current = true;
    setPending(true);
    try {
      await deleteDeck(uid, deck.id);
      if (!isMounted()) return;
      setTarget(undefined);
      showToast({ message: `Deleted deck “${deck.name}”.`, tone: "success" });
      onDeleted?.();
    } catch {
      // Preserve a still-open target for retry; after Close, the same failure remains visible globally.
      if (isMounted()) {
        errorToastId.current = showToast({
          message: "Unable to delete this deck. Check your connection and try again.",
          tone: "error",
        });
      }
    } finally {
      pendingRef.current = false;
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
