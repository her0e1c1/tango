import type { DeckEdit } from "@/entities/deck";

import * as React from "react";

import { useAuthSession } from "@/entities/auth";
import { editDeck, editLocalDeck } from "@/entities/deck";

interface UseDeckEditActionOptions {
  localMode: boolean;
  onSaved?: () => void;
}

export const useDeckEditAction = ({ localMode, onSaved }: UseDeckEditActionOptions) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const [error, setError] = React.useState<unknown>(null);

  const update = React.useCallback(
    async (deck: DeckEdit) => {
      setError(null);
      try {
        await (localMode ? editLocalDeck(deck) : editDeck(uid, deck));
        onSaved?.();
      } catch (nextError) {
        setError(nextError);
      }
    },
    [localMode, onSaved, uid]
  );

  return { error, update };
};
