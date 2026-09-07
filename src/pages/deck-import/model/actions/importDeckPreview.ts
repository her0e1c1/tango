import { getAuthSession } from "@/entities/auth";
import { executePreparedDeckImport } from "./executePreparedDeckImport";
import { showToast } from "@/shared/ui/toast";
import { beginImport, completeImport, failImport } from "../store";

export async function importDeckPreview(): Promise<boolean> {
  const session = getAuthSession();
  const uid = session.status === "authenticated" ? session.uid : "";
  const execution = beginImport(uid);
  if (execution === undefined) return false;
  try {
    const result = await executePreparedDeckImport(execution.uid, execution.preparedImport);
    // Results belong to the App even when the initiating Page has unmounted.
    showToast({ messageKey: "deckImport.toast.imported", messageParams: { count: result.created }, tone: "success" });
    completeImport();
    return true;
  } catch (error: unknown) {
    showToast({
      ...(error instanceof Error
        ? { messageKey: "deckImport.toast.failureWithReason" as const, messageParams: { reason: error.message } }
        : { messageKey: "deckImport.toast.failure" as const }),
      tone: "error",
    });
    failImport();
    return false;
  }
}
