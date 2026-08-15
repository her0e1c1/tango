import type { CardEdit } from "@/entities/card";

import * as React from "react";

import { useAuthSession } from "@/entities/auth";
import { editCard, editLocalCard } from "@/entities/card";

interface UseCardEditActionOptions {
  localMode: boolean;
  onSaved?: () => void;
}

export const useCardEditAction = ({ localMode, onSaved }: UseCardEditActionOptions) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const [error, setError] = React.useState<unknown>(null);

  const update = React.useCallback(
    async (card: CardEdit) => {
      setError(null);
      try {
        await (localMode ? editLocalCard(card) : editCard(uid, card));
        onSaved?.();
      } catch (nextError) {
        setError(nextError);
      }
    },
    [localMode, onSaved, uid]
  );

  return { error, update };
};
