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
type Failure = { variables: Variables; error: unknown };

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
  const inFlight = useRef(new Map<DeckId, Promise<void>>());
  const generation = useRef(0);
  const generationUid = useRef(uid);
  const [stateUid, setStateUid] = useState(uid);
  const [pendingState, setPendingState] = useState(() => ({ uid, ids: new Set<DeckId>() }));
  const failureRef = useRef<Failure>(undefined);
  const [failureState, setFailureState] = useState<{ uid: string; failure: Failure | undefined }>(() => ({
    uid,
    failure: undefined,
  }));
  if (stateUid !== uid) {
    setStateUid(uid);
    setPendingState({ uid, ids: new Set() });
    setFailureState({ uid, failure: undefined });
  }
  useEffect(() => {
    if (generationUid.current === uid) return;
    generationUid.current = uid;
    generation.current += 1;
    inFlight.current = new Map();
    failureRef.current = undefined;
  }, [uid]);
  const setPendingDeckIds = (update: (current: Set<DeckId>) => Set<DeckId>) => {
    setPendingState((current) => ({ uid, ids: update(current.uid === uid ? current.ids : new Set()) }));
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
    const failed = failureRef.current;
    const retryOf = failed != null && isSameOperation(failed.variables, variables) ? failed : undefined;
    const deckId = variables.deck.id;
    const current = inFlight.current.get(deckId);
    if (current != null) {
      if (retryOf != null) {
        return current.then(
          () => {
            if (generation.current !== operationGeneration || failureRef.current !== retryOf) return;
            return run(variables);
          },
          () => undefined
        );
      }
      return current;
    }

    setPendingDeckIds((pending) => new Set(pending).add(deckId));
    const operation = mutateAsync(variables).then(
      () => {
        if (generation.current !== operationGeneration) return;
        if (variables.kind === "remove") onRemoveSuccessRef.current?.(variables.deck);
        if (retryOf == null || failureRef.current !== retryOf) return;
        failureRef.current = undefined;
        setFailure(undefined);
      },
      (error: unknown) => {
        if (generation.current !== operationGeneration) throw error;
        const nextFailure = { variables, error };
        failureRef.current = nextFailure;
        setFailure(nextFailure);
        throw error;
      }
    );
    const settled = operation.finally(() => {
      if (generation.current !== operationGeneration) return;
      inFlight.current.delete(deckId);
      setPendingDeckIds((pending) => {
        const next = new Set(pending);
        next.delete(deckId);
        return next;
      });
    });
    inFlight.current.set(deckId, settled);
    return settled;
  };

  const pendingDeckIds = pendingState.uid === uid ? pendingState.ids : new Set<DeckId>();
  const failure = failureState.uid === uid ? failureState.failure : undefined;

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
