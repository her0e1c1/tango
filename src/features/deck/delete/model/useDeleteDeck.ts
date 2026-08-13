import type { Deck } from "@/entities/deck";

import { useAuthSession } from "@/entities/auth-session";
import { useAsyncAction } from "@/shared/hooks";
import { deleteDeck } from "../api/deleteDeck";

export const useDeleteDeck = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<string>(uid);

  return {
    remove: (deck: Deck) => mutation.run([deck.id], `remove:${deck.id}`, () => deleteDeck(uid, deck)),
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
