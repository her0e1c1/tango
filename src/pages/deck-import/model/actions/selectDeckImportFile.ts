import { ImportFailure } from "../../lib/importFailure";
import { getAuthUid } from "@/entities/auth";
import { generateCardId, type CardMutation } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";
import { parseCsv, type DeckImportRow } from "../../lib/cardCsv";
import { deckImportStore, type DeckImportStorageMode } from "../store";
import type { PreparedDeckImport } from "./executePreparedDeckImport";

interface DeckImportSource {
  name: string;
  rows: DeckImportRow[];
  storageMode?: DeckImportStorageMode;
}

function prepareDeckImport({ name, rows, storageMode = "remote" }: DeckImportSource, uid: string): PreparedDeckImport {
  const localMode = storageMode === "local";
  if (!localMode && uid === "") throw new ImportFailure("authentication");

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

export async function selectDeckImportFile(file: File): Promise<void> {
  const uid = getAuthUid();
  const { status, storageMode: selectedStorageMode } = deckImportStore.getState();
  const storageMode = uid === "" ? "local" : selectedStorageMode;
  if (status !== "idle") return;

  // Lock the selected mode until the read finishes, even if the Page unmounts.
  deckImportStore.setState({ storageMode, status: "validating", source: { kind: "empty" } });
  try {
    const analysis = await parseCsv(await file.text());
    // A read may outlive the session that selected it; never prepare it for a different account.
    if (getAuthUid() !== uid) {
      deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
      return;
    }
    const preparedImport =
      analysis.invalidCount === 0 && analysis.rows.length > 0
        ? prepareDeckImport({ name: file.name, rows: analysis.rows, storageMode }, uid)
        : undefined;
    deckImportStore.setState({
      status: "idle",
      source: { kind: "selected", preview: { deckName: file.name, analysis }, preparedImport },
    });
  } catch (error: unknown) {
    if (getAuthUid() !== uid) {
      deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
      return;
    }
    deckImportStore.setState({ status: "idle", source: { kind: "error", error } });
  }
}
