import { executePreparedDeckImport } from "./executePreparedDeckImport";
import { deckImportStore } from "../store";

export async function importDeckPreview(): Promise<boolean> {
  const { status, source } = deckImportStore.getState();
  if (status !== "idle" || source.kind !== "selected" || source.preparedImport === undefined) return false;

  deckImportStore.setState({ status: "importing" });
  try {
    await executePreparedDeckImport(source.preparedImport);
    return true;
  } catch (error: unknown) {
    deckImportStore.setState({ status: "idle", source: { kind: "error", error } });
    return false;
  }
}
