import { useState } from "react";

import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import type { DeckImportResult, PreparedDeckImport } from "./deckImportExecution";
import { executePreparedDeckImport } from "./deckImportExecution";
import type { DeckImportOperation } from "./useDeckImportOperation";

interface DeckImportExecutionState {
  uid: string;
  error: unknown;
  result: DeckImportResult | undefined;
}

const initialState = (uid: string): DeckImportExecutionState => ({
  uid,
  error: null,
  result: undefined,
});

export const useDeckImportExecution = (uid: string, operation: DeckImportOperation) => {
  const [state, setState] = useState<DeckImportExecutionState>(() => initialState(uid));

  if (state.uid !== uid) setState(initialState(uid));
  const currentState = state.uid === uid ? state : initialState(uid);
  const updateState = (update: Partial<Omit<DeckImportExecutionState, "uid">>) => {
    setState((current) => ({ ...(current.uid === uid ? current : initialState(uid)), ...update }));
  };

  const run = async (preparedImport: PreparedDeckImport) => {
    const generation = operation.start("importing");
    updateState({ error: null });

    try {
      const result = await executePreparedDeckImport(preparedImport, {
        uid,
        createDeck: (deck) => createDeck(uid, deck),
        mutateCards: (mutations) => mutateCards(uid, mutations),
      });
      if (operation.isCurrent(generation)) updateState({ result });
      return result;
    } catch (caughtError) {
      if (operation.isCurrent(generation)) updateState({ result: undefined, error: caughtError });
      throw caughtError;
    } finally {
      operation.finish(generation);
    }
  };

  return {
    run,
    clear: () => updateState({ error: null, result: undefined }),
    error: currentState.error,
    result: currentState.result,
  };
};
