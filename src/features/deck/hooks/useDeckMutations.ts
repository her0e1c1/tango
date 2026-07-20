/**
 * @file Provides the deck feature's Use Deck Mutations React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import { useEffect, useRef, useState } from "react";

import * as firestore from "@/adapters/firestore";
import { useAuth } from "@/auth/AuthContext";
import { createDeckMutationService } from "@/query/mutations/deckMutationService";
import { remoteStore } from "@/store/remoteStore";

type Variables = { kind: "create"; deck: Deck } | { kind: "update"; deck: DeckEdit } | { kind: "remove"; deck: Deck };
type Failure = { variables: Variables; error: unknown; sequence: number };

interface UseDeckMutationsOptions {
  onRemoveSuccess?: (deck: Deck) => void;
}

/**
 * Checks whether the supplied value satisfies the same operation condition.
 * A named predicate makes the decision rule reusable and easier to recognize at each call site.
 */
const isSameOperation = (left: Variables, right: Variables) =>
  left.kind === right.kind && left.deck.id === right.deck.id;

/**
 * Provides the deck mutations values and operations needed by React components.
 * Callers receive one focused interface without coordinating the deck feature's stores and
 * services themselves.
 */
export const useDeckMutations = ({ onRemoveSuccess }: UseDeckMutationsOptions = {}) => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const onRemoveSuccessRef = useRef(onRemoveSuccess);
  useEffect(() => {
    onRemoveSuccessRef.current = onRemoveSuccess;
  }, [onRemoveSuccess]);
  const inFlightRemovals = useRef(new Map<DeckId, Promise<void>>());
  const generation = useRef(0);
  const operationSequence = useRef(0);
  const generationUid = useRef(uid);
  const [stateUid, setStateUid] = useState(uid);
  const [pendingState, setPendingState] = useState(() => ({ uid, counts: new Map<DeckId, number>() }));
  const failureRef = useRef<Failure>(undefined);
  const [failureState, setFailureState] = useState<{ uid: string; failure: Failure | undefined }>(() => ({
    uid,
    failure: undefined,
  }));
  if (stateUid !== uid) {
    setStateUid(uid);
    setPendingState({ uid, counts: new Map() });
    setFailureState({ uid, failure: undefined });
  }
  useEffect(() => {
    if (generationUid.current === uid) return;
    generationUid.current = uid;
    generation.current += 1;
    inFlightRemovals.current = new Map();
    failureRef.current = undefined;
  }, [uid]);
  const setPendingCounts = (update: (current: Map<DeckId, number>) => Map<DeckId, number>) => {
    setPendingState((current) => ({ uid, counts: update(current.uid === uid ? current.counts : new Map()) }));
  };
  const setFailure = (failure: Failure | undefined) => setFailureState({ uid, failure });
  const service = createDeckMutationService({
    store: remoteStore,
    createDeck: firestore.deck.create,
    updateDeck: firestore.deck.update,
    removeDeck: firestore.deck.remove,
  });
  const mutateAsync = async (variables: Variables) => {
    if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
    const deck = variables.deck;
    if (variables.kind === "create") await service.create(uid, deck as Deck);
    else if (variables.kind === "update") await service.update(uid, deck);
    else await service.remove(uid, deck.id);
  };
  /**
   * Runs the current deck feature operation and returns its result.
   * Progress and failure cleanup stay in one place so callers observe a consistent workflow state.
   */
  const run = (variables: Variables): Promise<void> => {
    const operationGeneration = generation.current;
    const sequence = ++operationSequence.current;
    const failed = failureRef.current;
    const retryOf = failed != null && isSameOperation(failed.variables, variables) ? failed : undefined;
    const deckId = variables.deck.id;
    const currentRemoval = variables.kind === "remove" ? inFlightRemovals.current.get(deckId) : undefined;
    if (currentRemoval != null) {
      if (retryOf != null) {
        return currentRemoval.then(
          () => {
            if (generation.current !== operationGeneration || failureRef.current !== retryOf) return;
            return run(variables);
          },
          () => undefined
        );
      }
      return currentRemoval;
    }

    setPendingCounts((pending) => {
      const next = new Map(pending);
      next.set(deckId, (next.get(deckId) ?? 0) + 1);
      return next;
    });
    const operation = mutateAsync(variables).then(
      () => {
        if (generation.current !== operationGeneration) return;
        if (variables.kind === "remove") onRemoveSuccessRef.current?.(variables.deck);
        const currentFailure = failureRef.current;
        if (
          currentFailure != null &&
          currentFailure.sequence < sequence &&
          isSameOperation(currentFailure.variables, variables)
        ) {
          failureRef.current = undefined;
          setFailure(undefined);
        }
      },
      (error: unknown) => {
        if (generation.current !== operationGeneration) throw error;
        const nextFailure = { variables, error, sequence };
        failureRef.current = nextFailure;
        setFailure(nextFailure);
        throw error;
      }
    );
    const settled = operation.finally(() => {
      if (generation.current !== operationGeneration) return;
      if (inFlightRemovals.current.get(deckId) === settled) inFlightRemovals.current.delete(deckId);
      setPendingCounts((pending) => {
        const next = new Map(pending);
        const count = (next.get(deckId) ?? 1) - 1;
        if (count === 0) next.delete(deckId);
        else next.set(deckId, count);
        return next;
      });
    });
    if (variables.kind === "remove") inFlightRemovals.current.set(deckId, settled);
    return settled;
  };

  const pendingCounts = pendingState.uid === uid ? pendingState.counts : new Map<DeckId, number>();
  const failure = failureState.uid === uid ? failureState.failure : undefined;

  return {
    create: (deck: Deck) => run({ kind: "create", deck }),
    update: (deck: DeckEdit) => run({ kind: "update", deck }),
    remove: (deck: Deck) => run({ kind: "remove", deck }),
    pending: pendingCounts.size > 0,
    isPending: (id: DeckId) => pendingCounts.has(id),
    error: failure?.error ?? null,
    retry: () => {
      const failed = failureRef.current;
      if (failed != null) void run(failed.variables).catch(() => undefined);
    },
  };
};
