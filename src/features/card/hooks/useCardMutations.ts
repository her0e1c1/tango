import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";

import * as firestore from "@/action/firestore";
import { useAuth } from "@/auth/AuthContext";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { createCardMutationService } from "@/query/cardMutationService";

type CardMutationVariables =
  | { kind: "create"; card: Card }
  | { kind: "update"; card: CardEdit }
  | { kind: "remove"; id: CardId }
  | { kind: "bulkUpsert"; cards: Card[] };

const variableIds = (variables: CardMutationVariables): CardId[] => {
  if (variables.kind === "remove") return [variables.id];
  if (variables.kind === "bulkUpsert") return variables.cards.map((card) => card.id);
  return [variables.card.id];
};

export const useCardMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const client = useQueryClient();
  const remote = useRemoteCollections();
  const [, renderPending] = useState(0);
  const pendingCounts = useRef(new Map<CardId, number>());
  const lastFailed = useRef<CardMutationVariables>();
  const service = useMemo(
    () =>
      createCardMutationService({
        client,
        createCard: firestore.card.create,
        updateCard: firestore.card.update,
        removeCard: firestore.card.logicalRemove,
        upsertCard: firestore.card.upsert,
        readCards: firestore.card.readAll,
      }),
    [client]
  );

  const mutation = useMutation({
    retry: false,
    mutationFn: async (variables: CardMutationVariables) => {
      if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
      if (variables.kind === "create") {
        await service.create(uid, variables.card);
      } else if (variables.kind === "update") {
        await service.update(uid, variables.card);
      } else if (variables.kind === "remove") {
        await service.remove(uid, variables.id);
      } else {
        await service.bulkUpsert(uid, variables.cards);
      }
    },
  });

  const run = useCallback(
    async (variables: CardMutationVariables) => {
      const ids = variableIds(variables);
      ids.forEach((id) => {
        pendingCounts.current.set(id, (pendingCounts.current.get(id) ?? 0) + 1);
      });
      renderPending((value) => value + 1);
      try {
        await mutation.mutateAsync(variables);
        lastFailed.current = undefined;
      } catch (error) {
        lastFailed.current = variables;
        throw error;
      } finally {
        ids.forEach((id) => {
          const count = (pendingCounts.current.get(id) ?? 1) - 1;
          if (count === 0) pendingCounts.current.delete(id);
          else pendingCounts.current.set(id, count);
        });
        renderPending((value) => value + 1);
      }
    },
    [mutation]
  );

  const update = useCallback((card: CardEdit) => run({ kind: "update", card }), [run]);

  return {
    create: (card: Card) => run({ kind: "create", card }),
    update,
    updateBy: (id: CardId, callback: (card: Card) => Partial<Card>) => {
      const card = remote.cardById(id);
      if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
      return update({ ...card, ...callback(card) });
    },
    remove: (id: CardId) => {
      const card = remote.cardById(id);
      if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
      return run({ kind: "remove", id });
    },
    bulkUpsert: (cards: Card[]) => run({ kind: "bulkUpsert", cards }),
    isPending: (id: CardId) => pendingCounts.current.has(id),
    pending: pendingCounts.current.size > 0,
    error: mutation.error,
    retry: () => {
      const variables = lastFailed.current;
      if (variables != null) void run(variables).catch(() => undefined);
    },
  };
};
