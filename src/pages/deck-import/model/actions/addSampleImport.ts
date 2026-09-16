import { getAuthUid } from "@/entities/auth";
import { addSampleDeck } from "@/features/sample-import";
import { showToast } from "@/shared/ui/toast";
import { deckImportStore } from "../store";

export async function addSampleImport(): Promise<boolean> {
  if (deckImportStore.getState().status !== "idle") return false;
  // All import actions share this lock, including after Page re-entry.
  deckImportStore.setState({ status: "adding-sample" });
  try {
    const result = await addSampleDeck(getAuthUid());
    // Results belong to the App even when the initiating Page has unmounted.
    showToast({
      messageKey: "deckImport.toast.sampleAdded",
      messageParams: { count: result.created },
      tone: "success",
    });
    return true;
  } catch (error: unknown) {
    showToast({
      ...(error instanceof Error
        ? { messageKey: "deckImport.toast.sampleFailureWithReason" as const, messageParams: { reason: error.message } }
        : { messageKey: "deckImport.toast.sampleFailure" as const }),
      tone: "error",
    });
    return false;
  } finally {
    deckImportStore.setState({ status: "idle" });
  }
}
