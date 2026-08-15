import type { Card, CardCreateInput, CardId, CardRaw } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { generateDeckId } from "@/entities/deck";

import sampleCards from "../../../../sample/build/output.json";
import { CardBulkMutationError } from "../api/upsertImportedCards";
import { buildDeckImportPlan } from "../lib/deckImportAnalysis";
import type { DeckImportResult, DeckImportRow, DeckImportStorageMode } from "./deckImportTypes";

interface DeckImportAttempt {
  uid: string;
  deck: DeckCreateInput;
  createDeckPending: boolean;
  remainingUpserts: CardCreateInput[];
  createdIds: CardId[];
  updatedIds: CardId[];
  totals: Pick<DeckImportResult, "created" | "updated" | "skipped">;
}

export type DeckImportRequest =
  | {
      kind: "content";
      name: string;
      rows: DeckImportRow[];
      storageMode: DeckImportStorageMode;
      attempt?: DeckImportAttempt;
    }
  | { kind: "sample"; storageMode: DeckImportStorageMode; attempt?: DeckImportAttempt };

export interface DeckImportDependencies {
  uid: string;
  decks: Deck[];
  cardsByDeckId: (id: DeckId) => Card[];
  createDeck: (deck: DeckCreateInput) => Promise<unknown>;
  generateCardId: () => string;
  bulkUpsert: (cards: CardCreateInput[], createdIds: CardId[], localMode: boolean) => Promise<unknown>;
  fetchDecks?: (uid: string) => Promise<Deck[]>;
  fetchCards?: (uid: string) => Promise<Card[]>;
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
  const localMode = request.storageMode === "local";
  const ownerUid = uid === "" && localMode ? "local" : uid;
  const preferredDeckId = request.kind === "sample" ? sampleDeckId(uid) : undefined;
  const rows = request.kind === "sample" ? rowsFromCards(sampleCards as CardRaw[]) : request.rows;
  let deck: DeckCreateInput | undefined = decks.find(
    (candidate) =>
      candidate.localMode === localMode &&
      (preferredDeckId === undefined ? candidate.name === name : candidate.id === preferredDeckId)
  );
  const createDeckPending = deck == null;
  if (deck == null) {
    deck = { id: preferredDeckId ?? generateDeckId(), uid: ownerUid, name, localMode };
  }

  const existing = cardsByDeckId(deck.id);
  const byUniqueKey = new Map(existing.map((card) => [card.uniqueKey, card]));
  const plan = buildDeckImportPlan(rows, existing);
  const remainingUpserts: CardCreateInput[] = [];
  const createdIds: CardId[] = [];
  const updatedIds: CardId[] = [];
  plan.rows.forEach((row) => {
    const current = byUniqueKey.get(row.card.uniqueKey);
    if (row.action === "create") {
      const card = { ...row.card, id: generateCardId(), deckId: deck.id, uid: deck.uid } satisfies CardCreateInput;
      remainingUpserts.push(card);
      createdIds.push(card.id);
    } else if (row.action === "update" && current != null) {
      remainingUpserts.push({ ...current, ...row.card });
      updatedIds.push(current.id);
    }
  });

  return {
    uid,
    deck,
    createDeckPending,
    remainingUpserts,
    createdIds,
    updatedIds,
    totals: { created: plan.created, updated: plan.updated, skipped: plan.unchanged },
  };
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

export const executeDeckImport = async (
  request: DeckImportRequest,
  { uid, decks, cardsByDeckId, createDeck, generateCardId, bulkUpsert, fetchDecks, fetchCards }: DeckImportDependencies
): Promise<DeckImportResult> => {
  if (uid === "" && request.storageMode === "remote") throw new Error("A confirmed user is required for imports");

  let activeDecks = decks;
  let getCardsByDeckId = cardsByDeckId;
  if (request.storageMode === "remote" && fetchDecks != null && fetchCards != null) {
    try {
      const [remoteDecks, remoteCards] = await Promise.all([fetchDecks(uid), fetchCards(uid)]);
      activeDecks = remoteDecks;
      getCardsByDeckId = (deckId: DeckId) => remoteCards.filter((card) => card.deckId === deckId);
    } catch {
      // Fall back to passed dependencies if remote fetch fails
    }
  }

  let attempt = request.attempt;
  if (attempt == null || attempt.uid !== uid) {
    attempt = prepareDeckImportAttempt(request, {
      uid,
      decks: activeDecks,
      cardsByDeckId: getCardsByDeckId,
      generateCardId,
    });
    request.attempt = attempt;
  }
  if (attempt.createDeckPending) {
    await createDeck(attempt.deck);
    attempt.createDeckPending = false;
  }

  const upserts = attempt.remainingUpserts;
  try {
    if (upserts.length > 0) await bulkUpsert(upserts, attempt.createdIds, attempt.deck.localMode === true);
  } catch (error) {
    const failedIds = error instanceof CardBulkMutationError ? error.failedIds : upserts.map((card) => card.id);
    const failed = new Set(failedIds);
    attempt.remainingUpserts = upserts.filter((card) => failed.has(card.id));
    throw Object.assign(new Error(`Deck import did not complete: ${String(error)}`), {
      result: {
        created: attempt.createdIds.filter((id) => !failed.has(id)).length,
        updated: attempt.updatedIds.filter((id) => !failed.has(id)).length,
        skipped: attempt.totals.skipped,
        failed: attempt.remainingUpserts.length,
        deckId: attempt.deck.id,
      },
    });
  }

  attempt.remainingUpserts = [];
  return {
    ...attempt.totals,
    failed: 0,
    deckId: attempt.deck.id,
  };
};
