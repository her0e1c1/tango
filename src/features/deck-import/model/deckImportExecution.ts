import type { Card, CardMutation, RemoteCard } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId, RemoteDeck } from "@/entities/deck";

import { CardBulkMutationError, hasSameEditableCardContent, indexCardsByUniqueKey } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";

import type {
  DeckImportAction,
  DeckImportPlan,
  DeckImportPlanRow,
  DeckImportResult,
  DeckImportRow,
} from "./deckImportTypes";

export interface DeckImportAttempt {
  uid: string;
  deck: DeckCreateInput;
  createDeckPending: boolean;
  remainingMutations: CardMutation[];
  plan: DeckImportPlan;
}

export interface DeckImportRequest {
  name: string;
  preferredDeckId?: DeckId;
  rows: DeckImportRow[];
}

export interface DeckImportPreparationDependencies {
  uid: string;
  decks: Deck[];
  cards: Card[];
  generateCardId: () => string;
}

export interface DeckImportExecutionDependencies {
  uid: string;
  createDeck: (deck: DeckCreateInput) => Promise<unknown>;
  mutateCards: (mutations: CardMutation[]) => Promise<unknown>;
}

export const prepareDeckImport = (
  request: DeckImportRequest,
  { uid, decks, cards, generateCardId }: DeckImportPreparationDependencies
): DeckImportAttempt => {
  if (uid === "") throw new Error("A confirmed user is required for imports");

  let deck: DeckCreateInput | undefined = decks.find(
    (candidate): candidate is RemoteDeck =>
      !candidate.localMode &&
      (request.preferredDeckId === undefined
        ? candidate.name === request.name
        : candidate.id === request.preferredDeckId)
  );
  const createDeckPending = deck == null;
  if (deck == null) {
    deck = { id: request.preferredDeckId ?? generateDeckId(), uid, name: request.name };
  }

  const existing = cards.filter((card): card is RemoteCard => card.deckId === deck.id && "uid" in card);
  const byUniqueKey = indexCardsByUniqueKey(existing);
  const planRows: DeckImportPlanRow[] = [];
  const remainingMutations: CardMutation[] = [];
  const counts: Record<DeckImportAction, number> = { create: 0, update: 0, unchanged: 0 };
  for (const row of request.rows) {
    const current = byUniqueKey.get(row.card.uniqueKey);
    const action = current == null ? "create" : hasSameEditableCardContent(current, row.card) ? "unchanged" : "update";
    counts[action] += 1;
    planRows.push({ ...row, action });
    if (action === "create") {
      const card = { ...row.card, id: generateCardId(), deckId: deck.id, uid: deck.uid };
      remainingMutations.push({ kind: "create", card });
    } else if (action === "update" && current != null) {
      remainingMutations.push({ kind: "edit", card: { ...current, ...row.card } });
    }
  }

  return {
    uid,
    deck,
    createDeckPending,
    remainingMutations,
    plan: {
      rows: planRows,
      created: counts.create,
      updated: counts.update,
      unchanged: counts.unchanged,
    },
  };
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
  { uid, createDeck, mutateCards }: DeckImportExecutionDependencies
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
