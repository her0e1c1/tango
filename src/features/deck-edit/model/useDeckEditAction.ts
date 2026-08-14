import type { DeckEdit } from "@/entities/deck";

import * as React from "react";

import { useAuthSession } from "@/entities/auth";
import { editDeck } from "@/entities/deck";

interface UseDeckEditActionOptions {
  onSaved?: () => void;
}

export const useDeckEditAction = ({ onSaved }: UseDeckEditActionOptions = {}) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const [error, setError] = React.useState<unknown>(null);

  const update = React.useCallback(
    async (deck: DeckEdit) => {
      setError(null);
      try {
        await editDeck(uid, deck);
        onSaved?.();
      } catch (nextError) {
        setError(nextError);
      }
    },
    [onSaved, uid]
  );

  return { error, update };
};
