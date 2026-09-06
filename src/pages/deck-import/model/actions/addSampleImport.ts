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
      `Unable to add sample deck. ${error instanceof Error ? error.message : "The sample deck could not be added."}`,
    feedback
  );
  if (result === undefined || !feedback.isMounted()) return;
  showToast({
    message: `Added sample deck with ${String(result.created)} card${result.created === 1 ? "" : "s"}.`,
    tone: "success",
  });
  return result;
};
