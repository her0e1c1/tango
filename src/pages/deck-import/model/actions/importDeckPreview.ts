import { getAuthUid } from "@/entities/auth";
import { showToast } from "@/shared/ui/toast";
import { importFailureKey } from "../../lib/importFailure";
import { executePreparedDeckImport } from "./executePreparedDeckImport";
import { deckImportStore } from "../store";

export async function importDeckPreview(): Promise<boolean> {
  const { status, source } = deckImportStore.getState();
  if (status !== "idle" || source.kind !== "selected" || source.preparedImport === undefined) return false;

  const uid = getAuthUid();
  const onLocalError = (error: unknown) => {
    if (getAuthUid() === uid)
      showToast({ messageKey: importFailureKey(error) ?? "deckImport.toast.failure", tone: "error" });
  };
  deckImportStore.setState({ status: "importing" });
  try {
    await executePreparedDeckImport(source.preparedImport, onLocalError);
    if (getAuthUid() !== uid) {
      if (deckImportStore.getState().source === source)
        deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
      return false;
    }
    return true;
  } catch (error: unknown) {
    onLocalError(error);
    // Keep the prepared identities so retries cannot duplicate partially written data.
    if (deckImportStore.getState().source === source) deckImportStore.setState({ status: "idle" });
    return false;
  }
}
