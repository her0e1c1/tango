import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as firestore from "@/adapters/firestore";
import { useAuth } from "@/auth/AuthContext";
import { createRemoteCache } from "@/query/cache/remoteCache";
import { createDeckMutationService } from "@/query/mutations/deckMutationService";

type Variables = { kind: "create"; deck: Deck } | { kind: "update"; deck: DeckEdit } | { kind: "remove"; deck: Deck };
type Failure = { variables: Variables; error: unknown };

interface UseDeckMutationsOptions {
  onRemoveSuccess?: (deck: Deck) => void;
}

const isSameOperation = (left: Variables, right: Variables) =>
  left.kind === right.kind && left.deck.id === right.deck.id;

export const useDeckMutations = ({ onRemoveSuccess }: UseDeckMutationsOptions = {}) => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const client = useQueryClient();
  const onRemoveSuccessRef = useRef(onRemoveSuccess);
  useEffect(() => {
    onRemoveSuccessRef.current = onRemoveSuccess;
  }, [onRemoveSuccess]);
  const inFlight = useRef(new Map<DeckId, Promise<void>>());
  const [pendingDeckIds, setPendingDeckIds] = useState<Set<DeckId>>(() => new Set());
  const failureRef = useRef<Failure>(undefined);
  const [failure, setFailure] = useState<Failure>();
  const service = useMemo(
    () =>
      createDeckMutationService({
        cache: createRemoteCache(client),
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
      const failed = failureRef.current;
      const retryOf = failed != null && isSameOperation(failed.variables, variables) ? failed : undefined;
      const deckId = variables.deck.id;
      const current = inFlight.current.get(deckId);
      if (current != null) {
        if (retryOf != null) {
          void current.then(
            () => {
              if (failureRef.current !== retryOf) return;
              failureRef.current = undefined;
              setFailure(undefined);
            },
            () => undefined
          );
        }
        return current;
      }

      setPendingDeckIds((pending) => new Set(pending).add(deckId));
      const operation = mutation.mutateAsync(variables).then(
        () => {
          if (variables.kind === "remove") onRemoveSuccessRef.current?.(variables.deck);
          if (retryOf == null || failureRef.current !== retryOf) return;
          failureRef.current = undefined;
          setFailure(undefined);
        },
        (error: unknown) => {
          const nextFailure = { variables, error };
          failureRef.current = nextFailure;
          setFailure(nextFailure);
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
    error: failure?.error ?? null,
    retry: () => {
      const failed = failureRef.current;
      if (failed != null) void run(failed.variables).catch(() => undefined);
    },
  };
};
