import { useState } from "react";

import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import type { DeckImportResult, PreparedDeckImport } from "./deckImportExecution";
import { executePreparedDeckImport } from "./deckImportExecution";

interface DeckImportExecutionState {
  error: unknown;
  result: DeckImportResult | undefined;
}

const initialState = (): DeckImportExecutionState => ({ error: null, result: undefined });

export const useDeckImportExecution = (uid: string) => {
  const [state, setState] = useState<DeckImportExecutionState>(initialState);
  const updateState = (update: Partial<DeckImportExecutionState>) => {
    setState((current) => ({ ...current, ...update }));
  };

  const run = async (preparedImport: PreparedDeckImport) => {
    updateState({ error: null });
    try {
      const importResult = await executePreparedDeckImport(preparedImport, {
        uid,
        createDeck: (deck) => createDeck(uid, deck),
        mutateCards: (mutations) => mutateCards(uid, mutations),
      });
      updateState({ result: importResult });
      return importResult;
    } catch (caughtError) {
      updateState({ result: undefined, error: caughtError });
      throw caughtError;
    }
  };

  return {
    run,
    clear: () => updateState({ error: null, result: undefined }),
    error: state.error,
    result: state.result,
  };
};
