/** @file Provides Deck entity mutation state and actions. */

import type { Deck, DeckEdit, DeckId } from "../model/deck";

import { deckCommands } from "../api/commands";
import { useAuthSession } from "@/entities/auth-session/@x/deck";
import { useAsyncAction } from "@/shared/hooks";

export const useDeckMutations = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<DeckId>(uid);

  const create = (deck: Deck) => mutation.run([deck.id], `create:${deck.id}`, () => deckCommands.create(uid, deck));
  const update = (deck: DeckEdit) => mutation.run([deck.id], `update:${deck.id}`, () => deckCommands.update(uid, deck));

  return {
    create,
    update,
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
