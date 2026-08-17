import type { Card, CardMutation, RemoteCard } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { useState } from "react";

import {
  hasSameEditableCardContent,
  indexCardsByUniqueKey,
  mutateCards as persistCardMutations,
} from "@/entities/card";
import { createDeck as persistDeck, generateDeckId } from "@/entities/deck";

import type { DeckImportRow } from "../lib/cardCsv";

export type DeckImportStorageMode = "local" | "remote";
type DeckImportAction = "create" | "update" | "unchanged";

/** Stable destination identity independent from whether a Deck must be created. */
interface DeckImportDestination {
  id: DeckId;
  storageMode: DeckImportStorageMode;
}

export interface PreparedDeckImport {
  uid: string;
  destination: DeckImportDestination;
  createDeckInput?: DeckCreateInput;
  mutations: CardMutation[];
  plan: {
    rows: (DeckImportRow & { action: DeckImportAction })[];
    created: number;
    updated: number;
    unchanged: number;
  };
}

interface DeckImportSource {
  name: string;
  preferredDeckId?: DeckId;
  rows: DeckImportRow[];
  storageMode?: DeckImportStorageMode;
}

interface DeckImportPreparationDependencies {
  uid: string;
  decks: Deck[];
  cards: Card[];
  generateCardId: () => string;
}

interface DeckImportExecutionDependencies {
  uid: string;
  createDeck: (deck: DeckCreateInput) => Promise<unknown>;
  mutateCards: (mutations: CardMutation[]) => Promise<unknown>;
}

// Reports whether one Card belongs to account-backed persistence.
const isRemoteCard = (card: Card): card is RemoteCard => "uid" in card;

// Reports whether one Card belongs to the selected Deck persistence mode.
const usesStorageMode = (card: Card, storageMode: DeckImportStorageMode): boolean =>
  storageMode === "remote" ? isRemoteCard(card) : !isRemoteCard(card);

// Reports whether one public Deck matches the requested import destination.
const matchesDestination = (candidate: Deck, source: DeckImportSource, storageMode: DeckImportStorageMode): boolean => {
  if (candidate.localMode !== (storageMode === "local")) return false;
  return source.preferredDeckId === undefined
    ? candidate.name === source.name
    : candidate.id === source.preferredDeckId;
};

// Creates destination identity and the optional public command needed to persist a new Deck.
const createDestination = (
  source: DeckImportSource,
  storageMode: DeckImportStorageMode
): Pick<PreparedDeckImport, "destination" | "createDeckInput"> => {
  const id = source.preferredDeckId ?? generateDeckId();
  return {
    destination: { id, storageMode },
    createDeckInput: { id, name: source.name, localMode: storageMode === "local" },
  };
};

// Reuses one existing public Deck without representing it as a creation command.
const reuseDestination = (deck: Deck): Pick<PreparedDeckImport, "destination"> => ({
  destination: { id: deck.id, storageMode: deck.localMode ? "local" : "remote" },
});

// Determines whether one imported row creates, updates, or preserves a Card.
const actionFor = (existing: Card | undefined, row: DeckImportRow): DeckImportAction => {
  if (existing == null) return "create";
  return hasSameEditableCardContent(existing, row.card) ? "unchanged" : "update";
};

// Builds Card mutations and preview counts for one resolved Deck destination.
const prepareCardMutations = ({
  rows,
  existing,
  destinationId,
  uid,
  storageMode,
  generateCardId,
}: {
  rows: DeckImportRow[];
  existing: Card[];
  destinationId: DeckId;
  uid: string;
  storageMode: DeckImportStorageMode;
  generateCardId: () => string;
}): Pick<PreparedDeckImport, "plan" | "mutations"> => {
  const byUniqueKey = indexCardsByUniqueKey(existing);
  const planRows: PreparedDeckImport["plan"]["rows"] = [];
  const mutations: CardMutation[] = [];
  const counts: Record<DeckImportAction, number> = { create: 0, update: 0, unchanged: 0 };

  for (const row of rows) {
    const current = byUniqueKey.get(row.card.uniqueKey);
    const action = actionFor(current, row);
    counts[action] += 1;
    planRows.push({ ...row, action });

    if (action === "create") {
      const cardFields = { ...row.card, id: generateCardId(), deckId: destinationId };
      // Local persistence stays account-agnostic; Card mutation routing follows the parent Deck's storage mode.
      const card = storageMode === "local" ? cardFields : { ...cardFields, uid };
      mutations.push({ kind: "create", card });
    } else if (action === "update" && current != null) {
      mutations.push({ kind: "edit", card: { ...current, ...row.card } });
    }
  }

  return {
    mutations,
    plan: {
      rows: planRows,
      created: counts.create,
      updated: counts.update,
      unchanged: counts.unchanged,
    },
  };
};

// Resolves a Deck destination and prepares every Card change without performing persistence.
export const prepareDeckImport = (
  source: DeckImportSource,
  { uid, decks, cards, generateCardId }: DeckImportPreparationDependencies
): PreparedDeckImport => {
  const storageMode = source.storageMode ?? "remote";
  if (storageMode === "remote" && uid === "") throw new Error("A confirmed user is required for remote imports");

  const existingDeck = decks.find((candidate) => matchesDestination(candidate, source, storageMode));
  const preparedDestination =
    existingDeck === undefined ? createDestination(source, storageMode) : reuseDestination(existingDeck);
  const existing = cards.filter(
    (card) => card.deckId === preparedDestination.destination.id && usesStorageMode(card, storageMode)
  );

  return {
    uid,
    ...preparedDestination,
    ...prepareCardMutations({
      rows: source.rows,
      existing,
      destinationId: preparedDestination.destination.id,
      uid,
      storageMode,
      generateCardId,
    }),
  };
};

// Executes one immutable import plan after confirming that its authenticated context is unchanged.
export const executePreparedDeckImport = async (
  preparedImport: PreparedDeckImport,
  { uid, createDeck, mutateCards }: DeckImportExecutionDependencies
) => {
  if (preparedImport.uid !== uid) throw new Error("The prepared Deck import belongs to a different user");
  if (preparedImport.createDeckInput !== undefined) await createDeck(preparedImport.createDeckInput);
  if (preparedImport.mutations.length > 0) await mutateCards(preparedImport.mutations);

  return {
    created: preparedImport.plan.created,
    updated: preparedImport.plan.updated,
    skipped: preparedImport.plan.unchanged,
    deckId: preparedImport.destination.id,
  };
};

export type DeckImportResult = Awaited<ReturnType<typeof executePreparedDeckImport>>;

interface DeckImportExecutionState {
  error: unknown;
  result: DeckImportResult | undefined;
}

// Creates the initial import execution state.
const initialState = (): DeckImportExecutionState => ({ error: null, result: undefined });

// Executes prepared imports and exposes their latest result or error to React callers.
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
        createDeck: (deck) => persistDeck(uid, deck),
        mutateCards: (mutations) => persistCardMutations(uid, mutations),
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
