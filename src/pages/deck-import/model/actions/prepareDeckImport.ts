import type { CardMutation } from "@/entities/card";
import type { DeckId, LocalDeckCreateInput, RemoteDeckCreateInput } from "@/entities/deck";
import type { DeckImportRow } from "../../lib/cardCsv";
import type { DeckImportStorageMode, PreparedDeckImport } from "../types";
type DeckImportCreateInput = RemoteDeckCreateInput | LocalDeckCreateInput;
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

const createDestination = (
  source: DeckImportSource,
  storageMode: DeckImportStorageMode,
  generateDeckId: () => DeckId
): DeckImportCreateInput => {
  const id = generateDeckId();
  return storageMode === "local"
    ? { id, name: source.name, localMode: true }
    : { id, name: source.name, localMode: false };
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

  const destination = createDestination(source, storageMode, generateDeckId);

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
