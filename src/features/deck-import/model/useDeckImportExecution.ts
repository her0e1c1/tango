import type { Card, CardMutation, RemoteCard } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId, LocalDeckCreateInput } from "@/entities/deck";

import { useState } from "react";

import {
  hasSameEditableCardContent,
  indexCardsByUniqueKey,
  mutateCards as persistCardMutations,
} from "@/entities/card";
import { createDeck as persistDeck, fetchDecks, generateDeckId } from "@/entities/deck";

import type { DeckImportRow } from "../lib/cardCsv";

type DeckImportCreateInput = DeckCreateInput | LocalDeckCreateInput;
export type DeckImportStorageMode = "local" | "remote";

type DeckImportAction = "create" | "update" | "unchanged";

export type DeckImportDestination = { type: "new"; name: string } | { type: "existing"; deckId: DeckId };

export interface DeckImportDestinationOption {
  id: DeckId;
  label: string;
}

export interface PreparedDeckImport {
  uid: string;
  destination: DeckImportCreateInput;
  storageMode: DeckImportStorageMode;
  needsDeckCreation: boolean;
  mutations: CardMutation[];
  plan: {
    rows: (DeckImportRow & { action: DeckImportAction })[];
    created: number;
    updated: number;
    unchanged: number;
  };
}

interface DeckImportSource {
  destination: DeckImportDestination;
  rows: DeckImportRow[];
  storageMode?: DeckImportStorageMode;
}

interface DeckImportPreparationDependencies {
  uid: string;
  decks: Deck[];
  cards: Card[];
  generateCardId: () => string;
}

interface SampleDeckImportSource {
  id: DeckId;
  name: string;
  rows: DeckImportRow[];
}

interface SampleDeckImportPreparationDependencies extends DeckImportPreparationDependencies {
  decks: Deck[];
  cards: Card[];
}

interface DeckImportExecutionDependencies {
  uid: string;
  createDeck: (deck: DeckImportCreateInput) => Promise<unknown>;
  mutateCards: (mutations: CardMutation[]) => Promise<unknown>;
  loadDeck: (id: DeckId, storageMode: DeckImportStorageMode) => Promise<Deck | undefined>;
}

const isRemoteCard = (card: Card): card is RemoteCard => "uid" in card;

const usesStorageMode = (card: Card, storageMode: DeckImportStorageMode): boolean =>
  storageMode === "remote" ? isRemoteCard(card) : !isRemoteCard(card);

const createDestination = (name: string, uid: string, storageMode: DeckImportStorageMode): DeckImportCreateInput => {
  const id = generateDeckId();
  return storageMode === "local" ? { id, name, localMode: true } : { id, uid, name };
};

const reuseDestination = (deck: Deck): DeckImportCreateInput =>
  deck.localMode ? { id: deck.id, name: deck.name, localMode: true } : { id: deck.id, uid: deck.uid, name: deck.name };

const actionFor = (existing: Card | undefined, row: DeckImportRow): DeckImportAction => {
  if (existing == null) return "create";
  return hasSameEditableCardContent(existing, row.card) ? "unchanged" : "update";
};

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
      // Local persistence stays account-agnostic; Card mutation routing follows the parent Deck's localMode.
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

export const prepareDeckImport = (
  source: DeckImportSource,
  { uid, decks, cards, generateCardId }: DeckImportPreparationDependencies
): PreparedDeckImport => {
  const storageMode = source.storageMode ?? "remote";
  if (storageMode === "remote" && uid === "") throw new Error("A confirmed user is required for remote imports");

  let destination: DeckImportCreateInput;
  let existing: Card[];
  if (source.destination.type === "new") {
    destination = createDestination(source.destination.name, uid, storageMode);
    existing = [];
  } else {
    const { deckId } = source.destination;
    const selectedDeck = decks.find((candidate) => candidate.id === deckId);
    if (selectedDeck == null) throw new Error("The selected Deck is no longer available");
    if (selectedDeck.localMode !== (storageMode === "local")) {
      throw new Error("The selected Deck no longer uses the chosen storage mode");
    }
    destination = reuseDestination(selectedDeck);
    existing = cards.filter((card) => card.deckId === destination.id && usesStorageMode(card, storageMode));
  }
  return {
    uid,
    destination,
    storageMode,
    needsDeckCreation: source.destination.type === "new",
    ...prepareCardMutations({
      rows: source.rows,
      existing,
      destinationId: destination.id,
      uid,
      storageMode,
      generateCardId,
    }),
  };
};

// Sample bootstrap owns its stable destination so normal CSV imports never reuse a Deck implicitly.
export const prepareSampleDeckImport = (
  source: SampleDeckImportSource,
  { uid, decks, cards, generateCardId }: SampleDeckImportPreparationDependencies
): PreparedDeckImport => {
  if (uid === "") throw new Error("A confirmed user is required for the sample Deck");

  const existingDeck = decks.find((candidate) => candidate.id === source.id && !candidate.localMode);
  const destination = existingDeck == null ? { id: source.id, uid, name: source.name } : reuseDestination(existingDeck);
  const existing = cards.filter((card) => card.deckId === destination.id && usesStorageMode(card, "remote"));

  return {
    uid,
    destination,
    storageMode: "remote",
    needsDeckCreation: existingDeck == null,
    ...prepareCardMutations({
      rows: source.rows,
      existing,
      destinationId: destination.id,
      uid,
      storageMode: "remote",
      generateCardId,
    }),
  };
};

export const executePreparedDeckImport = async (
  preparedImport: PreparedDeckImport,
  { uid, createDeck, mutateCards, loadDeck }: DeckImportExecutionDependencies
) => {
  if (preparedImport.uid !== uid) throw new Error("The prepared Deck import belongs to a different user");
  if (!preparedImport.needsDeckCreation) {
    const currentDeck = await loadDeck(preparedImport.destination.id, preparedImport.storageMode);
    if (currentDeck == null) throw new Error("The selected Deck is no longer available");
    if (currentDeck.localMode !== (preparedImport.storageMode === "local")) {
      throw new Error("The selected Deck no longer uses the chosen storage mode");
    }
  }
  if (preparedImport.needsDeckCreation) await createDeck(preparedImport.destination);
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

const initialState = (): DeckImportExecutionState => ({ error: null, result: undefined });

export const useDeckImportExecution = (uid: string, decks: Deck[]) => {
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
        loadDeck: async (id, storageMode) => {
          if (storageMode === "local") return decks.find((deck) => deck.id === id);
          // Execution must reject a remotely deleted destination even when its subscription snapshot still lingers.
          return (await fetchDecks(uid)).find((deck) => deck.id === id);
        },
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
