import { importFailureKey } from "../../lib/importFailure";
import { executePreparedDeckImport } from "./executePreparedDeckImport";
import { showToast } from "@/shared/ui/toast";
import { deckImportStore } from "../store";

export async function importDeckPreview(): Promise<boolean> {
  const { status, source } = deckImportStore.getState();
  if (status !== "idle" || source.kind !== "selected" || source.preparedImport === undefined) return false;

  // Acquire the shared lock before asynchronous persistence can yield to another action.
  deckImportStore.setState({ status: "importing" });
  try {
    const prepared = source.preparedImport;
    await executePreparedDeckImport(prepared);
    // Results belong to the App even when the initiating Page has unmounted.
    showToast({
      messageKey: "deckImport.toast.imported",
      messageParams: { count: prepared.mutations.length },
      tone: "success",
    });
    deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
    return true;
  } catch (error: unknown) {
    showToast({
      messageKey: importFailureKey(error) ?? "deckImport.toast.failure",
      tone: "error",
    });
    // Keep the prepared Deck/Card IDs so retries are safe after partial writes.
    deckImportStore.setState({ status: "idle" });
    return false;
  }
}
