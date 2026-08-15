import type { Card, CardId, CardMutation, CardRaw, RemoteCard } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId, RemoteDeck } from "@/entities/deck";

import { CardBulkMutationError } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";

import sampleCards from "../../../../sample/build/output.json";
import { buildDeckImportPlan } from "../lib/deckImportAnalysis";
import type { DeckImportPlan, DeckImportResult, DeckImportRow } from "./deckImportTypes";

export interface DeckImportAttempt {
  uid: string;
  deck: DeckCreateInput;
  createDeckPending: boolean;
  remainingMutations: CardMutation[];
  createdIds: CardId[];
  updatedIds: CardId[];
  plan: DeckImportPlan;
  totals: Pick<DeckImportResult, "created" | "updated" | "skipped">;
}

export type DeckImportRequest =
  | { kind: "content"; name: string; rows: DeckImportRow[]; attempt?: DeckImportAttempt }
  | { kind: "sample"; attempt?: DeckImportAttempt };

export interface DeckImportDependencies {
  uid: string;
  decks: Deck[];
  cardsByDeckId: (id: DeckId) => Card[];
  createDeck: (deck: DeckCreateInput) => Promise<unknown>;
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
  const rows = request.kind === "sample" ? rowsFromCards(sampleCards as CardRaw[]) : request.rows;
  let deck: DeckCreateInput | undefined = decks.find(
    (candidate): candidate is RemoteDeck =>
      !candidate.localMode &&
      (preferredDeckId === undefined ? candidate.name === name : candidate.id === preferredDeckId)
  );
  const createDeckPending = deck == null;
  if (deck == null) {
    deck = { id: preferredDeckId ?? generateDeckId(), uid, name };
  }

  const existing = cardsByDeckId(deck.id).filter((card): card is RemoteCard => "uid" in card);
  const byUniqueKey = new Map(existing.map((card) => [card.uniqueKey, card]));
  const plan = buildDeckImportPlan(rows, existing);
  const remainingMutations: CardMutation[] = [];
  const createdIds: CardId[] = [];
  const updatedIds: CardId[] = [];
  plan.rows.forEach((row) => {
    const current = byUniqueKey.get(row.card.uniqueKey);
    if (row.action === "create") {
      const card = { ...row.card, id: generateCardId(), deckId: deck.id, uid: deck.uid };
      remainingMutations.push({ kind: "create", card });
      createdIds.push(card.id);
    } else if (row.action === "update" && current != null) {
      remainingMutations.push({ kind: "edit", card: { ...current, ...row.card } });
      updatedIds.push(current.id);
    }
  });

  return {
    uid,
    deck,
    createDeckPending,
    remainingMutations,
    createdIds,
    updatedIds,
    plan,
    totals: { created: plan.created, updated: plan.updated, skipped: plan.unchanged },
  };
};

export const prepareDeckImport = async (
  request: DeckImportRequest,
  { uid, decks, cardsByDeckId, generateCardId, fetchDecks, fetchCards }: DeckImportDependencies
): Promise<DeckImportAttempt> => {
  if (uid === "") throw new Error("A confirmed user is required for imports");
  if (request.attempt?.uid === uid) return request.attempt;

  let activeDecks = decks;
  let getCardsByDeckId = cardsByDeckId;
  if (request.kind === "content") {
    if (fetchDecks == null || fetchCards == null) {
      throw new Error("Server-backed Deck import dependencies are not available");
    }
    const [remoteDecks, remoteCards] = await Promise.all([fetchDecks(uid), fetchCards(uid)]);
    activeDecks = remoteDecks;
    getCardsByDeckId = (deckId: DeckId) => remoteCards.filter((card) => card.deckId === deckId);
  }

  const attempt = prepareDeckImportAttempt(request, {
    uid,
    decks: activeDecks,
    cardsByDeckId: getCardsByDeckId,
    generateCardId,
  });
  request.attempt = attempt;
  return attempt;
};

export const partialResultFrom = (error: unknown): DeckImportResult | undefined => {
  if (error == null || typeof error !== "object" || !("result" in error)) return undefined;
  const result = error.result;
  if (
    result == null ||
    typeof result !== "object" ||
    !("created" in result) ||
    !("updated" in result) ||
    !("skipped" in result) ||
    !("failed" in result) ||
    !("deckId" in result)
  ) {
    return undefined;
  }
  return result as DeckImportResult;
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
    attempt.remainingMutations = mutations.filter((mutation) => failed.has(mutation.card.id));
    throw Object.assign(new Error(`Deck import did not complete: ${String(error)}`), {
      result: {
        created: attempt.createdIds.filter((id) => !failed.has(id)).length,
        updated: attempt.updatedIds.filter((id) => !failed.has(id)).length,
        skipped: attempt.totals.skipped,
        failed: attempt.remainingMutations.length,
        deckId: attempt.deck.id,
      },
    });
  }

  attempt.remainingMutations = [];
  return {
    ...attempt.totals,
    failed: 0,
    deckId: attempt.deck.id,
  };
};
