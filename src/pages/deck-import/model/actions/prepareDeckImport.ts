import { generateCardId, type CardMutation } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";
import type { DeckImportRow } from "../../lib/cardCsv";
import type { DeckImportStorageMode, PreparedDeckImport } from "../types";

interface DeckImportSource {
  name: string;
  rows: DeckImportRow[];
  storageMode?: DeckImportStorageMode;
}

export function prepareDeckImport(
  { name, rows, storageMode = "remote" }: DeckImportSource,
  uid: string
): PreparedDeckImport {
  const localMode = storageMode === "local";
  if (!localMode && uid === "") throw new Error("A confirmed user is required for remote imports");

  const deckId = generateDeckId();
  const mutations = rows.map((row): CardMutation => {
    const cardFields = { ...row.card, id: generateCardId(), deckId };
    // Local persistence stays account-agnostic; Card mutation routing follows the parent Deck's localMode.
    const card = localMode ? cardFields : { ...cardFields, uid };
    return { kind: "create", card };
  });

  return {
    uid,
    destination: { id: deckId, name, localMode },
    mutations,
  };
}
