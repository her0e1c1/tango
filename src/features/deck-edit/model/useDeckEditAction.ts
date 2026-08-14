import type { DeckEdit } from "@/entities/deck";

import * as React from "react";

import { useAuthSession } from "@/entities/auth";

type EditDeck = (uid: string, deck: DeckEdit) => Promise<void>;

interface UseDeckEditActionOptions {
  editDeck?: EditDeck | undefined;
  onSaved?: () => void;
}

export const useDeckEditAction = ({ editDeck, onSaved }: UseDeckEditActionOptions = {}) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const [error, setError] = React.useState<unknown>(null);

  const update = React.useCallback(
    (deck: DeckEdit) => {
      setError(null);
      if (editDeck == null) {
        setError(new Error("Deck editing is unavailable"));
        return Promise.resolve();
      }
      return editDeck(uid, deck)
        .then(() => onSaved?.())
        .catch(setError);
    },
    [editDeck, onSaved, uid]
  );

  return { error, update };
};
