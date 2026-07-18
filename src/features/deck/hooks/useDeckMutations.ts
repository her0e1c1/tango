import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";

import * as firestore from "@/action/firestore";
import { useAuth } from "@/auth/AuthContext";
import { createDeckMutationService } from "@/query/deckMutationService";

type Variables = { kind: "create"; deck: Deck } | { kind: "update"; deck: DeckEdit } | { kind: "remove"; deck: Deck };

export const useDeckMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const client = useQueryClient();
  const inFlight = useRef(new Map<DeckId, Promise<void>>());
  const [pendingDeckIds, setPendingDeckIds] = useState<Set<DeckId>>(() => new Set());
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
    (variables: Variables) => {
      const deckId = variables.deck.id;
      const current = inFlight.current.get(deckId);
      if (current != null) return current;

      setPendingDeckIds((pending) => new Set(pending).add(deckId));
      const operation = mutation.mutateAsync(variables).then(
        () => {
          lastFailed.current = undefined;
        },
        (error: unknown) => {
          lastFailed.current = variables;
          throw error;
        }
      );
      const settled = operation.finally(() => {
        inFlight.current.delete(deckId);
        setPendingDeckIds((pending) => {
          const next = new Set(pending);
          next.delete(deckId);
          return next;
        });
      });
      inFlight.current.set(deckId, settled);
      return settled;
    },
    [mutation]
  );

  return {
    create: (deck: Deck) => run({ kind: "create", deck }),
    update: (deck: DeckEdit) => run({ kind: "update", deck }),
    remove: (deck: Deck) => run({ kind: "remove", deck }),
    pending: pendingDeckIds.size > 0,
    isPending: (id: DeckId) => pendingDeckIds.has(id),
    error: mutation.error,
    retry: () => {
      const variables = lastFailed.current;
      if (variables != null) void run(variables).catch(() => undefined);
    },
  };
};
