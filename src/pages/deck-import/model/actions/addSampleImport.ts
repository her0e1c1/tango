import { addSampleDeck } from "@/features/sample-import";
import { showToast } from "@/shared/ui/toast";
import type { DeckImportResult } from "../types";
import { runDeckImportSave, type DeckImportSaveFeedback } from "./runDeckImportSave";

export const addSampleImport = async (
  uid: string,
  feedback: DeckImportSaveFeedback
): Promise<DeckImportResult | undefined> => {
  const result = await runDeckImportSave(
    "adding-sample",
    () => addSampleDeck(uid),
    (error) =>
      error instanceof Error
        ? { messageKey: "deckImport.toast.sampleFailureWithReason", messageParams: { reason: error.message } }
        : { messageKey: "deckImport.toast.sampleFailure" },
    feedback
  );
  if (result === undefined || !feedback.isMounted()) return;
  showToast({
    messageKey: "deckImport.toast.sampleAdded",
    messageParams: { count: result.created },
    tone: "success",
  });
  return result;
};
