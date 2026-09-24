import { generateId } from "@/shared/lib/generateId";
import { ImportFailure } from "../../lib/importFailure";
import { getAuthUid } from "@/entities/auth";
import type { CardMutation } from "@/entities/card";
import { parseCsv, type DeckImportRow } from "../../lib/cardCsv";
import { deckImportStore } from "../store";
import type { PreparedDeckImport } from "./executePreparedDeckImport";

interface DeckImportSource {
  name: string;
  rows: DeckImportRow[];
}

function prepareDeckImport({ name, rows }: DeckImportSource, uid: string): PreparedDeckImport {
  if (uid === "") throw new ImportFailure("authentication");

  const deckId = generateId();
  const mutations = rows.map((row): CardMutation => {
    const cardFields = { ...row.card, id: generateId(), deckId };
    return { kind: "create", card: cardFields };
  });

  return {
    uid,
    destination: { id: deckId, name },
    mutations,
  };
}

export async function selectDeckImportFile(file: File): Promise<void> {
  const uid = getAuthUid();
  const { status } = deckImportStore.getState();
  if (status !== "idle") return;

  // Keep the selection locked until the read finishes, even if the Page unmounts.
  deckImportStore.setState({ status: "validating", source: { kind: "empty" } });
  try {
    const bytes = await file.arrayBuffer();
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new ImportFailure("encoding");
    }
    const analysis = await parseCsv(text);
    // A read may outlive the session that selected it; never prepare it for a different account.
    if (getAuthUid() !== uid) {
      deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
      return;
    }
    const preparedImport =
      analysis.invalidCount === 0 && analysis.rows.length > 0
        ? prepareDeckImport({ name: file.name, rows: analysis.rows }, uid)
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
