import { showToast } from "@/shared/ui/toast";
import { importFailureKey } from "../../lib/importFailure";
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
    showToast({ messageKey: importFailureKey(error) ?? "deckImport.toast.failure", tone: "error" });
    // Keep the prepared identities so retries cannot duplicate partially written data.
    deckImportStore.setState({ status: "idle" });
    return false;
  }
}
