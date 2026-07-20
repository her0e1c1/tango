/**
 * @file Provides the card feature's Use Card Mutations React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import { useEffect, useRef, useState } from "react";

import * as firestore from "@/adapters/firestore";
import { useAuth } from "@/auth/AuthContext";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { createCardMutationService } from "@/query/mutations/cardMutationService";

type CardMutationVariables =
  | { kind: "create"; card: Card }
  | { kind: "update"; card: CardEdit }
  | { kind: "remove"; id: CardId }
  | { kind: "bulkUpsert"; cards: Card[] };
type CardMutationFailure = { variables: CardMutationVariables; error: unknown; sequence: number };

/**
 * Returns the card identifiers affected by one mutation request.
 * The identifiers are used to detect conflicting queued or pending card operations.
 */
const variableIds = (variables: CardMutationVariables): CardId[] => {
  if (variables.kind === "remove") return [variables.id];
  if (variables.kind === "bulkUpsert") return variables.cards.map((card) => card.id);
  return [variables.card.id];
};

const sameMutationIdentity = (left: CardMutationVariables, right: CardMutationVariables) => {
  if (left.kind !== right.kind) return false;
  const leftIds = variableIds(left).sort();
  const rightIds = variableIds(right).sort();
  return leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index]);
};

interface CardMutationRunDependencies {
  mutateAsync: (variables: CardMutationVariables) => Promise<unknown>;
  failureRef: { current: CardMutationFailure | undefined };
  setPendingCounts: (update: (current: Map<CardId, number>) => Map<CardId, number>) => void;
  setError: (error: unknown) => void;
  sequence: number;
  generation: number;
  currentGeneration: { current: number };
}

/**
 * Runs the card mutation workflow for the card feature.
 * The sequence and its cleanup remain together so partial failures can be handled consistently.
 */
const runCardMutation = async (
  variables: CardMutationVariables,
  {
    mutateAsync,
    failureRef,
    setPendingCounts,
    setError,
    sequence,
    generation,
    currentGeneration,
  }: CardMutationRunDependencies
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
    if (currentGeneration.current !== generation) return;
    const failed = failureRef.current;
    if (failed != null && failed.sequence < sequence && sameMutationIdentity(failed.variables, variables)) {
      failureRef.current = undefined;
      setError(null);
    }
  } catch (error) {
    if (currentGeneration.current !== generation) throw error;
    failureRef.current = { variables, error, sequence };
    setError(error);
    throw error;
  } finally {
    if (currentGeneration.current === generation) {
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
  }
};

/**
 * Provides the card mutations values and operations needed by React components.
 * Callers receive one focused interface without coordinating the card feature's stores and
 * services themselves.
 */
export const useCardMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const remote = useRemoteCollections();
  const generation = useRef(0);
  const operationSequence = useRef(0);
  const generationUid = useRef(uid);
  const [stateUid, setStateUid] = useState(uid);
  const [pendingState, setPendingState] = useState(() => ({ uid, counts: new Map<CardId, number>() }));
  const [errorState, setErrorState] = useState<{ uid: string; error: unknown }>(() => ({
    uid,
    error: null,
  }));
  const failureRef = useRef<CardMutationFailure>(undefined);
  if (stateUid !== uid) {
    setStateUid(uid);
    setPendingState({ uid, counts: new Map() });
    setErrorState({ uid, error: null });
  }
  useEffect(() => {
    if (generationUid.current === uid) return;
    generationUid.current = uid;
    generation.current += 1;
    failureRef.current = undefined;
  }, [uid]);
  const setPendingCounts = (update: (current: Map<CardId, number>) => Map<CardId, number>) => {
    setPendingState((current) => ({
      uid,
      counts: update(current.uid === uid ? current.counts : new Map()),
    }));
  };
  const setError = (error: unknown) => setErrorState({ uid, error });
  const service = createCardMutationService({
    createCard: firestore.card.create,
    updateCard: firestore.card.update,
    removeCard: firestore.card.logicalRemove,
    upsertCard: firestore.card.upsert,
  });

  const mutateAsync = async (variables: CardMutationVariables) => {
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
  };

  /**
   * Runs the current card feature operation and returns its result.
   * Progress and failure cleanup stay in one place so callers observe a consistent workflow state.
   */
  const run = (variables: CardMutationVariables) =>
    runCardMutation(variables, {
      mutateAsync,
      failureRef,
      setPendingCounts,
      setError,
      sequence: ++operationSequence.current,
      generation: generation.current,
      currentGeneration: generation,
    });

  /** Queues an update for the supplied card with the shared pending, error, and retry state. */
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
    isPending: (id: CardId) => pendingState.uid === uid && pendingState.counts.has(id),
    pending: pendingState.uid === uid && pendingState.counts.size > 0,
    error: errorState.uid === uid ? errorState.error : null,
    retry: () => {
      const failure = failureRef.current;
      if (failure != null) void run(failure.variables).catch(() => undefined);
    },
  };
};
