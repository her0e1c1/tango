import type { CardEdit } from "@/entities/card";

import * as React from "react";

import { useAuthSession } from "@/entities/auth";

type EditCard = (uid: string, card: CardEdit) => Promise<void>;

interface UseCardEditActionOptions {
  editCard?: EditCard | undefined;
  onSaved?: () => void;
}

export const useCardEditAction = ({ editCard, onSaved }: UseCardEditActionOptions = {}) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const [error, setError] = React.useState<unknown>(null);

  const update = React.useCallback(
    (card: CardEdit) => {
      setError(null);
      if (editCard == null) {
        setError(new Error("Card editing is unavailable"));
        return Promise.resolve();
      }
      return editCard(uid, card)
        .then(() => onSaved?.())
        .catch(setError);
    },
    [editCard, onSaved, uid]
  );

  return { error, update };
};
