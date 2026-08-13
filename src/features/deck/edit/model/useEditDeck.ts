import type { DeckEdit } from "@/entities/deck";

import { useAuthSession } from "@/entities/auth-session";
import { useAsyncAction } from "@/shared/hooks";
import { editDeck } from "../api/editDeck";

export const useEditDeck = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<string>(uid);
  return {
    update: (deck: DeckEdit) => mutation.run([deck.id], `update:${deck.id}`, () => editDeck(uid, deck)),
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
