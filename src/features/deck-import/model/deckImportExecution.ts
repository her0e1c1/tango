import type { Card, CardMutation, CardRaw, RemoteCard } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId, LocalDeckCreateInput, RemoteDeck } from "@/entities/deck";

import { CardBulkMutationError } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";

import sampleCards from "../../../../sample/build/output.json";
import { buildDeckImportPlan } from "../lib/deckImportAnalysis";
import type { DeckImportPlan, DeckImportResult, DeckImportRow, DeckImportStorageMode } from "./deckImportTypes";

type DeckImportCreateInput = DeckCreateInput | LocalDeckCreateInput;

export interface DeckImportAttempt {
  uid: string;
  deck: DeckImportCreateInput;
  createDeckPending: boolean;
  remainingMutations: CardMutation[];
  plan: DeckImportPlan;
}

export type DeckImportRequest =
  | { kind: "content"; name: string; rows: DeckImportRow[]; storageMode: DeckImportStorageMode }
  | { kind: "sample"; storageMode: "remote" };

export interface DeckImportDependencies {
  uid: string;
  decks: Deck[];
  cardsByDeckId: (id: DeckId) => Card[];
  createDeck: (deck: DeckImportCreateInput) => Promise<unknown>;
  generateCardId: () => string;
  mutateCards: (mutations: CardMutation[]) => Promise<unknown>;
  fetchDecks?: (uid: string) => Promise<RemoteDeck[]>;
  fetchCards?: (uid: string) => Promise<RemoteCard[]>;
}

type DeckImportPreparationDependencies = Pick<
  DeckImportDependencies,
  "uid" | "decks" | "cardsByDeckId" | "generateCardId"
>;

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;

const sampleDeckId = (uid: string): DeckId => `sample-v${SAMPLE_VERSION}-${uid}`;

const rowsFromCards = (cards: CardRaw[]): DeckImportRow[] =>
  cards.map((card, index) => ({ rowNumber: index + 1, card }));

const prepareDeckImportAttempt = (
  request: DeckImportRequest,
  { uid, decks, cardsByDeckId, generateCardId }: DeckImportPreparationDependencies
): DeckImportAttempt => {
  const name = request.kind === "sample" ? SAMPLE_DECK_NAME : request.name;
  const preferredDeckId = request.kind === "sample" ? sampleDeckId(uid) : undefined;
  const rows = request.kind === "sample" ? rowsFromCards(sampleCards) : request.rows;
  const localMode = request.storageMode === "local";
  let deck: DeckImportCreateInput | undefined = decks.find(
    (candidate) =>
      candidate.localMode === localMode &&
      (preferredDeckId === undefined ? candidate.name === name : candidate.id === preferredDeckId)
  );
  const createDeckPending = deck == null;
  if (deck == null) {
    const id = preferredDeckId ?? generateDeckId();
    deck = localMode ? { id, name, localMode: true } : { id, uid, name };
  }

  const existing = cardsByDeckId(deck.id).filter((card) => "uid" in card !== localMode);
  const byUniqueKey = new Map(existing.map((card) => [card.uniqueKey, card]));
  const plan = buildDeckImportPlan(rows, existing, request.storageMode);
  const remainingMutations: CardMutation[] = [];
  plan.rows.forEach((row) => {
    const current = byUniqueKey.get(row.card.uniqueKey);
    if (row.action === "create") {
      const cardFields = { ...row.card, id: generateCardId(), deckId: deck.id };
      // Local persistence stays account-agnostic; Card mutation routing follows the parent Deck's localMode.
      const card = localMode ? cardFields : { ...cardFields, uid };
      remainingMutations.push({ kind: "create", card });
    } else if (row.action === "update" && current != null) {
      remainingMutations.push({ kind: "edit", card: { ...current, ...row.card } });
    }
  });

  return {
    uid,
    deck,
    createDeckPending,
    remainingMutations,
    plan,
  };
};

export const prepareDeckImport = async (
  request: DeckImportRequest,
  { uid, decks, cardsByDeckId, generateCardId, fetchDecks, fetchCards }: DeckImportDependencies
): Promise<DeckImportAttempt> => {
  if (request.storageMode === "remote" && uid === "") {
    throw new Error("A confirmed user is required for remote imports");
  }

  let activeDecks = decks;
  let getCardsByDeckId = cardsByDeckId;
  if (request.kind === "content" && request.storageMode === "remote") {
    if (fetchDecks == null || fetchCards == null) {
      throw new Error("Server-backed Deck import dependencies are not available");
    }
    // Listener-backed stores can lag, so user-provided imports are planned from authoritative server reads.
    const [remoteDecks, remoteCards] = await Promise.all([fetchDecks(uid), fetchCards(uid)]);
    activeDecks = remoteDecks;
    getCardsByDeckId = (deckId: DeckId) => remoteCards.filter((card) => card.deckId === deckId);
  }

  return prepareDeckImportAttempt(request, {
    uid,
    decks: activeDecks,
    cardsByDeckId: getCardsByDeckId,
    generateCardId,
  });
};

class DeckImportExecutionError extends Error {
  readonly result: DeckImportResult;

  constructor(message: string, options: ErrorOptions & { result: DeckImportResult }) {
    super(message, options);
    this.result = options.result;
  }
}

export const partialResultFrom = (error: unknown): DeckImportResult | undefined =>
  error instanceof DeckImportExecutionError ? error.result : undefined;

const resultFrom = (attempt: DeckImportAttempt, failedMutations: CardMutation[]): DeckImportResult => {
  const failedCreates = failedMutations.filter((mutation) => mutation.kind === "create").length;
  const failedUpdates = failedMutations.length - failedCreates;
  // The plan remains the total source of truth while retries retain only mutations that still failed.
  return {
    created: attempt.plan.created - failedCreates,
    updated: attempt.plan.updated - failedUpdates,
    skipped: attempt.plan.unchanged,
    failed: failedMutations.length,
    deckId: attempt.deck.id,
  };
};

export const executePreparedDeckImport = async (
  attempt: DeckImportAttempt,
  { uid, createDeck, mutateCards }: DeckImportDependencies
): Promise<DeckImportResult> => {
  if (attempt.uid !== uid) throw new Error("The prepared Deck import belongs to a different user");
  if (attempt.createDeckPending) {
    await createDeck(attempt.deck);
    attempt.createDeckPending = false;
  }

  const mutations = attempt.remainingMutations;
  try {
    if (mutations.length > 0) await mutateCards(mutations);
  } catch (error) {
    const failedIds =
      error instanceof CardBulkMutationError ? error.failedIds : mutations.map((mutation) => mutation.card.id);
    const failed = new Set(failedIds);
    // Preserve only failed writes so a retry keeps stable IDs without replaying writes that already succeeded.
    attempt.remainingMutations = mutations.filter((mutation) => failed.has(mutation.card.id));
    throw new DeckImportExecutionError(`Deck import did not complete: ${String(error)}`, {
      cause: error,
      result: resultFrom(attempt, attempt.remainingMutations),
    });
  }

  attempt.remainingMutations = [];
  return resultFrom(attempt, []);
};
