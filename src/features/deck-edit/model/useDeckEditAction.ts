import type { DeckEdit } from "@/entities/deck";

import * as React from "react";

import { useAuthUid } from "@/entities/auth";
import { editDeck } from "@/entities/deck";

interface UseDeckEditActionOptions {
  onSaved?: () => void;
}

export const useDeckEditAction = ({ onSaved }: UseDeckEditActionOptions = {}) => {
  const uid = useAuthUid();
  const [error, setError] = React.useState<unknown>(null);

  const update = async (deck: DeckEdit) => {
    setError(null);
    try {
      await editDeck(uid, deck);
      onSaved?.();
    } catch (nextError) {
      setError(nextError);
    }
  };

  return { error, update };
};
