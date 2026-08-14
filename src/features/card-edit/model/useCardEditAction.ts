import type { CardEdit } from "@/entities/card";

import * as React from "react";

import { useAuthSession } from "@/entities/auth";
import { editCard } from "@/entities/card";

interface UseCardEditActionOptions {
  onSaved?: () => void;
}

export const useCardEditAction = ({ onSaved }: UseCardEditActionOptions = {}) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const [error, setError] = React.useState<unknown>(null);

  const update = React.useCallback(
    async (card: CardEdit) => {
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
