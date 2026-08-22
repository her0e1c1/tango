import type { CardMutation } from "@/entities/card";
import type { DeckCreateInput, DeckId, LocalDeckCreateInput } from "@/entities/deck";

import { useState } from "react";

import { mutateCards as persistCardMutations } from "@/entities/card";
import { createDeck as persistDeck } from "@/entities/deck";

import type { DeckImportRow } from "../lib/cardCsv";

type DeckImportCreateInput = DeckCreateInput | LocalDeckCreateInput;
export type DeckImportStorageMode = "local" | "remote";

export interface PreparedDeckImport {
  uid: string;
  destination: DeckImportCreateInput;
  mutations: CardMutation[];
}

interface DeckImportSource {
  name: string;
  rows: DeckImportRow[];
  storageMode?: DeckImportStorageMode;
}

interface DeckImportPreparationDependencies {
  uid: string;
  generateDeckId: () => DeckId;
  generateCardId: (row: DeckImportRow) => string;
}

interface DeckImportExecutionDependencies {
  uid: string;
  createDeck: (deck: DeckImportCreateInput) => Promise<unknown>;
  mutateCards: (mutations: CardMutation[]) => Promise<unknown>;
}

const createDestination = (
  source: DeckImportSource,
  uid: string,
  storageMode: DeckImportStorageMode,
  generateDeckId: () => DeckId
): DeckImportCreateInput => {
  const id = generateDeckId();
  return storageMode === "local" ? { id, name: source.name, localMode: true } : { id, uid, name: source.name };
};

const prepareCardCreations = ({
  rows,
  destinationId,
  uid,
  storageMode,
  generateCardId,
}: {
  rows: DeckImportRow[];
  destinationId: DeckId;
  uid: string;
  storageMode: DeckImportStorageMode;
  generateCardId: (row: DeckImportRow) => string;
}): CardMutation[] =>
  rows.map((row) => {
    const cardFields = { ...row.card, id: generateCardId(row), deckId: destinationId };
    // Local persistence stays account-agnostic; Card mutation routing follows the parent Deck's localMode.
    const card = storageMode === "local" ? cardFields : { ...cardFields, uid };
    return { kind: "create", card };
  });

export const prepareDeckImport = (
  source: DeckImportSource,
  { uid, generateDeckId, generateCardId }: DeckImportPreparationDependencies
): PreparedDeckImport => {
  const storageMode = source.storageMode ?? "remote";
  if (storageMode === "remote" && uid === "") throw new Error("A confirmed user is required for remote imports");

  const destination = createDestination(source, uid, storageMode, generateDeckId);

  return {
    uid,
    destination,
    mutations: prepareCardCreations({
      rows: source.rows,
      destinationId: destination.id,
      uid,
      storageMode,
      generateCardId,
    }),
  };
};

const executePreparedDeckImport = async (
  preparedImport: PreparedDeckImport,
  { uid, createDeck, mutateCards }: DeckImportExecutionDependencies
) => {
  if (preparedImport.uid !== uid) throw new Error("The prepared Deck import belongs to a different user");
  await createDeck(preparedImport.destination);
  if (preparedImport.mutations.length > 0) await mutateCards(preparedImport.mutations);

  return {
    created: preparedImport.mutations.length,
    deckId: preparedImport.destination.id,
  };
};

export type DeckImportResult = Awaited<ReturnType<typeof executePreparedDeckImport>>;

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

  const run = async (operation: () => Promise<DeckImportResult>): Promise<DeckImportResult | undefined> => {
    updateState({ error: null });
    let importResult: DeckImportResult | undefined;
    try {
      importResult = await operation();
      updateState({ result: importResult });
    } catch (caughtError) {
      updateState({ result: undefined, error: caughtError });
    }
    return importResult;
  };

  const runPrepared = (prepare: () => PreparedDeckImport) =>
    run(() =>
      executePreparedDeckImport(prepare(), {
        uid,
        createDeck: (deck) => persistDeck(uid, deck),
        mutateCards: (mutations) => persistCardMutations(uid, mutations),
      })
    );

  return {
    run,
    runPrepared,
    clear: () => updateState({ error: null, result: undefined }),
    error: state.error,
    result: state.result,
  };
};
