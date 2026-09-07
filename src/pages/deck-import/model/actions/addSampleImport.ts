import { getAuthUid } from "@/entities/auth";
import { addSampleDeck } from "@/features/sample-import";
import { showToast } from "@/shared/ui/toast";
import { beginSampleImport, completeSampleImport, failSampleImport } from "../store";

export async function addSampleImport(): Promise<boolean> {
  if (!beginSampleImport()) return false;
  try {
    const result = await addSampleDeck(getAuthUid());
    // Results belong to the App even when the initiating Page has unmounted.
    showToast({
      messageKey: "deckImport.toast.sampleAdded",
      messageParams: { count: result.created },
      tone: "success",
    });
    completeSampleImport();
    return true;
  } catch (error: unknown) {
    showToast({
      ...(error instanceof Error
        ? { messageKey: "deckImport.toast.sampleFailureWithReason" as const, messageParams: { reason: error.message } }
        : { messageKey: "deckImport.toast.sampleFailure" as const }),
      tone: "error",
    });
    failSampleImport();
    return false;
  }
}
