import { importFailureKey } from "../../lib/importFailure";
import { addSampleDeck } from "@/features/sample-import";
import { showToast } from "@/shared/ui/toast";
import { deckImportStore } from "../store";

export async function addSampleImport(): Promise<boolean> {
  if (deckImportStore.getState().status !== "idle") return false;
  // All import actions share this lock, including after Page re-entry.
  deckImportStore.setState({ status: "adding-sample" });
  try {
    const result = await addSampleDeck();
    // Results belong to the App even when the initiating Page has unmounted.
    showToast({
      messageKey: "deckImport.toast.sampleAdded",
      messageParams: { count: result.created },
      tone: "success",
    });
    return true;
  } catch (error: unknown) {
    showToast({
      messageKey: importFailureKey(error) ?? "deckImport.toast.sampleFailure",
      tone: "error",
    });
    return false;
  } finally {
    deckImportStore.setState({ status: "idle" });
  }
}
