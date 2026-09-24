import { importFailureKey } from "../../lib/importFailure";
import { executePreparedDeckImport } from "./executePreparedDeckImport";
import { deckImportStore } from "../store";

export function importDeckPreview(): boolean {
  const { status, source } = deckImportStore.getState();
  if (status !== "idle" || source.kind !== "selected" || source.preparedImport === undefined) return false;

  deckImportStore.setState({ status: "importing" });
  try {
    executePreparedDeckImport(source.preparedImport);
    return true;
  } catch (error: unknown) {
    deckImportStore.setState({ status: "idle", source: { kind: "error", error: importFailureKey(error) ?? error } });
    return false;
  }
}
