import type { CardEditInput } from "@/entities/card";

import React from "react";

import { useAuthUid } from "@/entities/auth";
import { editCard } from "@/entities/card";

interface UseCardEditActionOptions {
  onSaved?: () => void;
}

export const useCardEditAction = ({ onSaved }: UseCardEditActionOptions = {}) => {
  const uid = useAuthUid();
  const [error, setError] = React.useState<unknown>(null);

  const update = React.useCallback(
    async (card: CardEditInput) => {
      setError(null);
      try {
        await editCard(uid, card);
        onSaved?.();
      } catch (nextError) {
        setError(nextError);
      }
    },
    [onSaved, uid]
  );

  return { error, update };
};
