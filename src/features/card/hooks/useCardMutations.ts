import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import * as type from "@/action/type";
import * as firestore from "@/action/firestore";
import { useAuth } from "@/auth/AuthContext";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { createCardMutationService } from "@/query/cardMutationService";

type CardMutationVariables =
  | { kind: "create"; card: Card; local: boolean }
  | { kind: "update"; card: CardEdit; local: boolean }
  | { kind: "remove"; id: CardId; local: boolean }
  | { kind: "bulkUpsert"; cards: Card[]; localIds: CardId[] };

const variableIds = (variables: CardMutationVariables): CardId[] => {
  if (variables.kind === "remove") return [variables.id];
  if (variables.kind === "bulkUpsert") return variables.cards.map((card) => card.id);
  return [variables.card.id];
};

export const useCardMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const dispatch = useDispatch();
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
      if (variables.kind === "create") {
        if (variables.local) dispatch(type.cardInsert(variables.card));
        else await service.create(uid, variables.card);
      } else if (variables.kind === "update") {
        if (variables.local) dispatch(type.cardUpdate(variables.card));
        else await service.update(uid, variables.card);
      } else if (variables.kind === "remove") {
        if (variables.local) dispatch(type.cardDelete(variables.id));
        else await service.remove(uid, variables.id);
      } else {
        const localIds = new Set(variables.localIds);
        const localCards = variables.cards.filter((card) => localIds.has(card.id));
        const remoteCards = variables.cards.filter((card) => !localIds.has(card.id));
        if (localCards.length > 0) dispatch(type.cardBulkInsert(localCards));
        if (remoteCards.length > 0) await service.bulkUpsert(uid, remoteCards);
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

  const isLocal = useCallback(
    (deckId: DeckId) => {
      const deck = remote.deckById(deckId);
      if (deck == null) throw new Error(`Deck ${deckId} is not available`);
      return deck.localMode;
    },
    [remote]
  );

  const update = useCallback(
    (card: CardEdit) => run({ kind: "update", card, local: isLocal(card.deckId) }),
    [isLocal, run]
  );

  return {
    create: (card: Card) => run({ kind: "create", card, local: isLocal(card.deckId) }),
    update,
    updateBy: (id: CardId, callback: (card: Card) => Partial<Card>) => {
      const card = remote.cardById(id);
      if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
      return update({ ...card, ...callback(card) });
    },
    remove: (id: CardId) => {
      const card = remote.cardById(id);
      if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
      return run({ kind: "remove", id, local: isLocal(card.deckId) });
    },
    bulkUpsert: (cards: Card[], localMode?: boolean) =>
      run({
        kind: "bulkUpsert",
        cards,
        localIds: cards.filter((card) => localMode ?? isLocal(card.deckId)).map((card) => card.id),
      }),
    isPending: (id: CardId) => pendingCounts.current.has(id),
    pending: pendingCounts.current.size > 0,
    error: mutation.error,
    retry: () => {
      const variables = lastFailed.current;
      if (variables != null) void run(variables).catch(() => undefined);
    },
  };
};
