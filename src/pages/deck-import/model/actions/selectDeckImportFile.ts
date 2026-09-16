import { getAuthUid } from "@/entities/auth";
import { parseCsv } from "../../lib/cardCsv";
import { deckImportStore } from "../store";
import { prepareDeckImport } from "./prepareDeckImport";

export async function selectDeckImportFile(file: File): Promise<void> {
  const uid = getAuthUid();
  const { status, storageMode } = deckImportStore.getState();
  if (status !== "idle") return;

  // Lock the selected mode until the read finishes, even if the Page unmounts.
  deckImportStore.setState({ status: "validating", source: { kind: "empty" } });
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
