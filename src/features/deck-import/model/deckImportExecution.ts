import type { Card, CardMutation, RemoteCard } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId, LocalDeckCreateInput, RemoteDeck } from "@/entities/deck";

import { CardBulkMutationError, hasSameEditableCardContent, indexCardsByUniqueKey } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";

import type {
  DeckImportAction,
  DeckImportPlan,
  DeckImportPlanRow,
  DeckImportResult,
  DeckImportRow,
  DeckImportStorageMode,
} from "./deckImportTypes";

type DeckImportCreateInput = DeckCreateInput | LocalDeckCreateInput;

export interface DeckImportAttempt {
  uid: string;
  deck: DeckImportCreateInput;
  createDeckPending: boolean;
  remainingMutations: CardMutation[];
  plan: DeckImportPlan;
}

export interface DeckImportRequest {
  name: string;
  preferredDeckId?: DeckId;
  rows: DeckImportRow[];
  storageMode?: DeckImportStorageMode;
}

export interface DeckImportPreparationDependencies {
  uid: string;
  decks: Deck[];
  cards: Card[];
  generateCardId: () => string;
}

export interface DeckImportExecutionDependencies {
  uid: string;
  createDeck: (deck: DeckImportCreateInput) => Promise<unknown>;
  mutateCards: (mutations: CardMutation[]) => Promise<unknown>;
}

const isRemoteDeck = (deck: Deck): deck is RemoteDeck => !deck.localMode;
const isRemoteCard = (card: Card): card is RemoteCard => "uid" in card;

const matchesImportDestination = (candidate: Deck, request: DeckImportRequest, localMode: boolean): boolean =>
  isRemoteDeck(candidate) !== localMode &&
  (request.preferredDeckId === undefined ? candidate.name === request.name : candidate.id === request.preferredDeckId);

const createImportDeck = (request: DeckImportRequest, uid: string, localMode: boolean): DeckImportCreateInput => {
  const id = request.preferredDeckId ?? generateDeckId();
  return localMode ? { id, name: request.name, localMode: true } : { id, uid, name: request.name };
};

const prepareCardMutations = ({
  rows,
  existing,
  deckId,
  uid,
  localMode,
  generateCardId,
}: {
  rows: DeckImportRow[];
  existing: Card[];
  deckId: DeckId;
  uid: string;
  localMode: boolean;
  generateCardId: () => string;
}): Pick<DeckImportAttempt, "plan" | "remainingMutations"> => {
  const byUniqueKey = indexCardsByUniqueKey(existing);
  const planRows: DeckImportPlanRow[] = [];
  const remainingMutations: CardMutation[] = [];
  const counts: Record<DeckImportAction, number> = { create: 0, update: 0, unchanged: 0 };
  for (const row of rows) {
    const current = byUniqueKey.get(row.card.uniqueKey);
    const action = current == null ? "create" : hasSameEditableCardContent(current, row.card) ? "unchanged" : "update";
    counts[action] += 1;
    planRows.push({ ...row, action });
    if (action === "create") {
      const cardFields = { ...row.card, id: generateCardId(), deckId };
      // Local persistence stays account-agnostic; Card mutation routing follows the parent Deck's localMode.
      const card = localMode ? cardFields : { ...cardFields, uid };
      remainingMutations.push({ kind: "create", card });
    } else if (action === "update" && current != null) {
      remainingMutations.push({ kind: "edit", card: { ...current, ...row.card } });
    }
  }

  return {
    remainingMutations,
    plan: {
      rows: planRows,
      created: counts.create,
      updated: counts.update,
      unchanged: counts.unchanged,
    },
  };
};

export const prepareDeckImport = (
  request: DeckImportRequest,
  { uid, decks, cards, generateCardId }: DeckImportPreparationDependencies
): DeckImportAttempt => {
  const localMode = request.storageMode === "local";
  if (!localMode && uid === "") throw new Error("A confirmed user is required for remote imports");

  let deck: DeckImportCreateInput | undefined = decks.find((candidate) =>
    matchesImportDestination(candidate, request, localMode)
  );
  const createDeckPending = deck == null;
  if (deck == null) deck = createImportDeck(request, uid, localMode);

  const existing = cards.filter((card) => card.deckId === deck.id && isRemoteCard(card) !== localMode);
  const preparedCards = prepareCardMutations({
    rows: request.rows,
    existing,
    deckId: deck.id,
    uid,
    localMode,
    generateCardId,
  });

  return {
    uid,
    deck,
    createDeckPending,
    ...preparedCards,
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
