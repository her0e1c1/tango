import { generateCardId, type CardMutation } from "@/entities/card";
import { generateDeckId, type DeckId, type LocalDeckCreateInput, type RemoteDeckCreateInput } from "@/entities/deck";
import type { DeckImportRow } from "../../lib/cardCsv";
import type { DeckImportStorageMode, PreparedDeckImport } from "../types";
type DeckImportCreateInput = RemoteDeckCreateInput | LocalDeckCreateInput;
interface DeckImportSource {
  name: string;
  rows: DeckImportRow[];
  storageMode?: DeckImportStorageMode;
}

const createDestination = (source: DeckImportSource, storageMode: DeckImportStorageMode): DeckImportCreateInput => {
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
}: {
  rows: DeckImportRow[];
  destinationId: DeckId;
  uid: string;
  storageMode: DeckImportStorageMode;
}): CardMutation[] =>
  rows.map((row) => {
    const cardFields = { ...row.card, id: generateCardId(), deckId: destinationId };
    // Local persistence stays account-agnostic; Card mutation routing follows the parent Deck's localMode.
    const card = storageMode === "local" ? cardFields : { ...cardFields, uid };
    return { kind: "create", card };
  });

export function prepareDeckImport(source: DeckImportSource, uid: string): PreparedDeckImport {
  const storageMode = source.storageMode ?? "remote";
  if (storageMode === "remote" && uid === "") throw new Error("A confirmed user is required for remote imports");

  const destination = createDestination(source, storageMode);

  return {
    uid,
    destination,
    mutations: prepareCardCreations({
      rows: source.rows,
      destinationId: destination.id,
      uid,
      storageMode,
    }),
  };
}
