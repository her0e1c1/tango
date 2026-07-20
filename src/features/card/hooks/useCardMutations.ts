import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import * as firestore from "@/adapters/firestore";
import { useAuth } from "@/auth/AuthContext";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { createRemoteCache } from "@/query/cache/remoteCache";
import { createCardMutationService } from "@/query/mutations/cardMutationService";

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

interface CardMutationRunDependencies {
  mutateAsync: (variables: CardMutationVariables) => Promise<unknown>;
  lastFailed: { current: CardMutationVariables | undefined };
  setPendingCounts: (update: (current: Map<CardId, number>) => Map<CardId, number>) => void;
}

const runCardMutation = async (
  variables: CardMutationVariables,
  { mutateAsync, lastFailed, setPendingCounts }: CardMutationRunDependencies
) => {
  const ids = variableIds(variables);
  setPendingCounts((current) => {
    const next = new Map(current);
    ids.forEach((id) => {
      next.set(id, (next.get(id) ?? 0) + 1);
    });
    return next;
  });
  try {
    await mutateAsync(variables);
    lastFailed.current = undefined;
  } catch (error) {
    lastFailed.current = variables;
    throw error;
  } finally {
    setPendingCounts((current) => {
      const next = new Map(current);
      ids.forEach((id) => {
        const count = (next.get(id) ?? 1) - 1;
        if (count === 0) next.delete(id);
        else next.set(id, count);
      });
      return next;
    });
  }
};

export const useCardMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const client = useQueryClient();
  const remote = useRemoteCollections();
  const [pendingCounts, setPendingCounts] = useState(() => new Map<CardId, number>());
  const lastFailed = useRef<CardMutationVariables>(undefined);
  const service = createCardMutationService({
    cache: createRemoteCache(client),
    createCard: firestore.card.create,
    updateCard: firestore.card.update,
    removeCard: firestore.card.logicalRemove,
    upsertCard: firestore.card.upsert,
    readCards: firestore.card.readAll,
  });

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

  const run = (variables: CardMutationVariables) =>
    runCardMutation(variables, {
      mutateAsync: mutation.mutateAsync,
      lastFailed,
      setPendingCounts,
    });

  const update = (card: CardEdit) => run({ kind: "update", card });

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
    isPending: (id: CardId) => pendingCounts.has(id),
    pending: pendingCounts.size > 0,
    error: mutation.error,
    retry: () => {
      const variables = lastFailed.current;
      if (variables != null) void run(variables).catch(() => undefined);
    },
  };
};
