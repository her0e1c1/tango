import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";

import * as firestore from "@/action/firestore";
import { useAuth } from "@/auth/AuthContext";
import { createDeckMutationService } from "@/query/deckMutationService";

type Variables = { kind: "create"; deck: Deck } | { kind: "update"; deck: DeckEdit } | { kind: "remove"; deck: Deck };

export const useDeckMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const client = useQueryClient();
  const lastFailed = useRef<Variables>(undefined);
  const service = useMemo(
    () =>
      createDeckMutationService({
        client,
        createDeck: firestore.deck.create,
        updateDeck: firestore.deck.update,
        removeDeck: firestore.deck.remove,
      }),
    [client]
  );
  const mutation = useMutation({
    retry: false,
    mutationFn: async (variables: Variables) => {
      if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
      const deck = variables.deck;
      if (variables.kind === "create") await service.create(uid, deck as Deck);
      else if (variables.kind === "update") await service.update(uid, deck);
      else await service.remove(uid, deck.id);
    },
  });
  const run = useCallback(
    async (variables: Variables) => {
      try {
        await mutation.mutateAsync(variables);
        lastFailed.current = undefined;
      } catch (error) {
        lastFailed.current = variables;
        throw error;
      }
    },
    [mutation]
  );

  return {
    create: (deck: Deck) => run({ kind: "create", deck }),
    update: (deck: DeckEdit) => run({ kind: "update", deck }),
    remove: (deck: Deck) => run({ kind: "remove", deck }),
    pending: mutation.isPending,
    error: mutation.error,
    retry: () => {
      const variables = lastFailed.current;
      if (variables != null) void run(variables).catch(() => undefined);
    },
  };
};
