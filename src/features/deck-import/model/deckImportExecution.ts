import type { Card, CardMutation, RemoteCard } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId, LocalDeckCreateInput } from "@/entities/deck";

import { hasSameEditableCardContent, indexCardsByUniqueKey } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";

import type { DeckImportRow } from "../lib/cardCsv";

type DeckImportCreateInput = DeckCreateInput | LocalDeckCreateInput;
export type DeckImportStorageMode = "local" | "remote";

type DeckImportAction = "create" | "update" | "unchanged";

interface DeckImportAttempt {
  uid: string;
  deck: DeckImportCreateInput;
  createDeck: boolean;
  mutations: CardMutation[];
  plan: {
    rows: (DeckImportRow & { action: DeckImportAction })[];
    created: number;
    updated: number;
    unchanged: number;
  };
}

interface DeckImportRequest {
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
  createDeck: (deck: DeckImportCreateInput) => Promise<unknown>;
  mutateCards: (mutations: CardMutation[]) => Promise<unknown>;
}

const isRemoteCard = (card: Card): card is RemoteCard => "uid" in card;

const matchesImportDestination = (candidate: Deck, request: DeckImportRequest, localMode: boolean): boolean =>
  candidate.localMode === localMode &&
  request.preferredDeckId !== undefined &&
  candidate.id === request.preferredDeckId;

const createImportDeck = (request: DeckImportRequest, uid: string, localMode: boolean): DeckImportCreateInput => {
  const id = request.preferredDeckId ?? generateDeckId();
  return localMode ? { id, name: request.name, localMode: true } : { id, uid, name: request.name };
};

const reuseImportDeck = (deck: Deck, uid: string): DeckImportCreateInput =>
  deck.localMode ? { id: deck.id, name: deck.name, localMode: true } : { id: deck.id, uid, name: deck.name };

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
}): Pick<DeckImportAttempt, "plan" | "mutations"> => {
  const byUniqueKey = indexCardsByUniqueKey(existing);
  const planRows: DeckImportAttempt["plan"]["rows"] = [];
  const mutations: CardMutation[] = [];
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
  request: DeckImportRequest,
  { uid, decks, cards, generateCardId }: DeckImportPreparationDependencies
): DeckImportAttempt => {
  const localMode = request.storageMode === "local";
  if (!localMode && uid === "") throw new Error("A confirmed user is required for remote imports");

  const existingDeck = decks.find((candidate) => matchesImportDestination(candidate, request, localMode));
  // View models intentionally omit ownership metadata, so remote commands recover it from the active session.
  const deck = existingDeck == null ? createImportDeck(request, uid, localMode) : reuseImportDeck(existingDeck, uid);

  const existing = cards.filter((card) => card.deckId === deck.id && isRemoteCard(card) !== localMode);
  return {
    uid,
    deck,
    createDeck: existingDeck == null,
    ...prepareCardMutations({ rows: request.rows, existing, deckId: deck.id, uid, localMode, generateCardId }),
  };
};

export const executePreparedDeckImport = async (
  attempt: DeckImportAttempt,
  { uid, createDeck, mutateCards }: DeckImportExecutionDependencies
) => {
  if (attempt.uid !== uid) throw new Error("The prepared Deck import belongs to a different user");
  if (attempt.createDeck) await createDeck(attempt.deck);
  if (attempt.mutations.length > 0) await mutateCards(attempt.mutations);

  return {
    created: attempt.plan.created,
    updated: attempt.plan.updated,
    skipped: attempt.plan.unchanged,
    deckId: attempt.deck.id,
  };
};

export type DeckImportResult = Awaited<ReturnType<typeof executePreparedDeckImport>>;
