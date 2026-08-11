import { useEffect, useRef, useState } from "react";

interface Failure<Id> {
  ids: readonly Id[];
  operationKey: string;
  task: () => Promise<unknown>;
  retrying?: boolean;
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

  const run = async <T>(ids: readonly Id[], operationKey: string, task: () => Promise<T>): Promise<T> => {
    const operationGeneration = generation.current;
    updatePending(ids, 1);

    try {
      const result = await task();
      if (currentScope.current === scope && generation.current === operationGeneration) {
        const failure = lastFailure.current;
        if (failure?.operationKey === operationKey) {
          lastFailure.current = null;
          setState((current) => (current.scope === scope ? { ...current, error: null } : current));
        }
      }
      return result;
    } catch (nextError) {
      if (currentScope.current === scope && generation.current === operationGeneration) {
        lastFailure.current = { ids, operationKey, task };
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
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable; remove after biomejs/biome#11174.
    if (failure == null || failure.retrying === true) return;
    failure.retrying = true;
    void run(failure.ids, failure.operationKey, failure.task)
      .catch(() => undefined)
      .finally(() => {
        if (lastFailure.current === failure) failure.retrying = false;
      });
  };

  return {
    run,
    retry,
    error: currentState.error,
    pending: currentState.pendingCounts.size > 0,
    isPending: (id: Id) => currentState.pendingCounts.has(id),
  };
};
