import { useEffect, useRef, useState } from "react";

interface Failure<Id> {
  ids: readonly Id[];
  task: () => Promise<unknown>;
}

interface ActionState<Id> {
  scope: string;
  pendingCounts: ReadonlyMap<Id, number>;
  error: unknown;
}

const initialActionState = <Id>(scope: string): ActionState<Id> => ({
  scope,
  pendingCounts: new Map(),
  error: null,
});

export const useAsyncAction = <Id>(scope: string) => {
  const generation = useRef(0);
  const currentScope = useRef(scope);
  const sequence = useRef(0);
  const lastFailure = useRef<Failure<Id> | null>(null);
  const [state, setState] = useState<ActionState<Id>>(() => initialActionState(scope));
  const currentState = state.scope === scope ? state : initialActionState<Id>(scope);

  useEffect(() => {
    currentScope.current = scope;
    generation.current += 1;
    lastFailure.current = null;
    return () => {
      generation.current += 1;
      lastFailure.current = null;
    };
  }, [scope]);

  const updatePending = (ids: readonly Id[], delta: 1 | -1) => {
    setState((current) => {
      const scoped = current.scope === scope ? current : initialActionState<Id>(scope);
      const pendingCounts = new Map(scoped.pendingCounts);
      for (const id of new Set(ids)) {
        const count = (pendingCounts.get(id) ?? 0) + delta;
        if (count <= 0) pendingCounts.delete(id);
        else pendingCounts.set(id, count);
      }
      return { ...scoped, pendingCounts };
    });
  };

  const run = async <T>(ids: readonly Id[], task: () => Promise<T>): Promise<T> => {
    const operationGeneration = generation.current;
    const operationSequence = ++sequence.current;
    lastFailure.current = null;
    setState((current) => ({
      ...(current.scope === scope ? current : initialActionState<Id>(scope)),
      error: null,
    }));
    updatePending(ids, 1);

    try {
      return await task();
    } catch (nextError) {
      if (
        currentScope.current === scope &&
        generation.current === operationGeneration &&
        sequence.current === operationSequence
      ) {
        lastFailure.current = { ids, task };
        setState((current) => (current.scope === scope ? { ...current, error: nextError } : current));
      }
      throw nextError;
    } finally {
      if (currentScope.current === scope && generation.current === operationGeneration) {
        updatePending(ids, -1);
      }
    }
  };

  const retry = () => {
    const failure = lastFailure.current;
    if (failure == null) return;
    void run(failure.ids, failure.task).catch(() => undefined);
  };

  return {
    run,
    retry,
    error: currentState.error,
    pending: currentState.pendingCounts.size > 0,
    isPending: (id: Id) => currentState.pendingCounts.has(id),
  };
};
