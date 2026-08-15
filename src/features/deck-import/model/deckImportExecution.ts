import type { Card, CardCreateInput, CardId, CardRaw } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { generateDeckId } from "@/entities/deck";

import sampleCards from "../../../../sample/build/output.json";
import { CardBulkMutationError } from "../api/upsertImportedCards";
import { buildDeckImportPlan } from "../lib/deckImportAnalysis";
import type { DeckImportResult, DeckImportRow } from "./deckImportTypes";

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
  | { kind: "content"; name: string; rows: DeckImportRow[]; attempt?: DeckImportAttempt }
  | { kind: "sample"; attempt?: DeckImportAttempt };

export interface DeckImportDependencies {
  uid: string;
  decks: Deck[];
  cardsByDeckId: (id: DeckId) => Card[];
  createDeck: (deck: DeckCreateInput) => Promise<unknown>;
  generateCardId: () => string;
  bulkUpsert: (cards: CardCreateInput[], createdIds: CardId[]) => Promise<unknown>;
  fetchDecks?: ((uid: string) => Promise<Deck[]>) | undefined;
  fetchCards?: ((uid: string) => Promise<Card[]>) | undefined;
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
  let deck: DeckCreateInput | undefined = decks.find((candidate) =>
    preferredDeckId === undefined ? candidate.name === name : candidate.id === preferredDeckId
  );
  const createDeckPending = deck == null;
  if (deck == null) {
    deck = { id: preferredDeckId ?? generateDeckId(), uid, name };
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

interface ResolvedImportData {
  activeDecks: Deck[];
  getCardsByDeckId: (deckId: DeckId) => Card[];
}

const resolveActiveImportData = async (
  uid: string,
  requestKind: DeckImportRequest["kind"],
  defaults: { decks: Deck[]; cardsByDeckId: (id: DeckId) => Card[] },
  fetchers: {
    fetchDecks?: ((uid: string) => Promise<Deck[]>) | undefined;
    fetchCards?: ((uid: string) => Promise<Card[]>) | undefined;
  }
): Promise<ResolvedImportData> => {
  if (fetchers.fetchDecks == null && fetchers.fetchCards == null) {
    return { activeDecks: defaults.decks, getCardsByDeckId: defaults.cardsByDeckId };
  }
  try {
    const [remoteDecks, remoteCards] = await Promise.all([
      fetchers.fetchDecks != null ? fetchers.fetchDecks(uid) : Promise.resolve(defaults.decks),
      fetchers.fetchCards != null ? fetchers.fetchCards(uid) : Promise.resolve([]),
    ]);
    return {
      activeDecks: fetchers.fetchDecks != null ? remoteDecks : defaults.decks,
      getCardsByDeckId:
        fetchers.fetchCards != null
          ? (deckId: DeckId) => remoteCards.filter((card) => card.deckId === deckId)
          : defaults.cardsByDeckId,
    };
  } catch (cause) {
    if (requestKind === "sample") {
      throw cause;
    }
    return { activeDecks: defaults.decks, getCardsByDeckId: defaults.cardsByDeckId };
  }
};

export const executeDeckImport = async (
  request: DeckImportRequest,
  { uid, decks, cardsByDeckId, createDeck, generateCardId, bulkUpsert, fetchDecks, fetchCards }: DeckImportDependencies
): Promise<DeckImportResult> => {
  if (uid === "") throw new Error("A confirmed user is required for imports");

  const { activeDecks, getCardsByDeckId } = await resolveActiveImportData(
    uid,
    request.kind,
    { decks, cardsByDeckId },
    { fetchDecks, fetchCards }
  );

  if (request.kind === "sample" && activeDecks.length > 0) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      deckId: "",
    };
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
    if (upserts.length > 0) await bulkUpsert(upserts, attempt.createdIds);
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
