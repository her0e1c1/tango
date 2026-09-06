import type { RefObject } from "react";
import { showToast } from "@/shared/ui/toast";
import { getPreparedDeckImport } from "../queries/getPreparedDeckImport";
import type { DeckImportPreviewState, DeckImportResult, PreparedDeckImport } from "../types";
import { executePreparedDeckImport } from "./executePreparedDeckImport";
import { runDeckImportSave, type DeckImportSaveFeedback } from "./runDeckImportSave";

export const importDeckPreview = async (
  uid: string,
  preview: DeckImportPreviewState["preview"],
  preparedImportRef: RefObject<PreparedDeckImport | undefined>,
  feedback: DeckImportSaveFeedback
): Promise<DeckImportResult | undefined> => {
  const result = await runDeckImportSave(
    "importing",
    () => executePreparedDeckImport(uid, getPreparedDeckImport(preview, preparedImportRef.current)),
    (error) => `Import failed. ${error instanceof Error ? error.message : "The import could not be completed."}`,
    feedback
  );
  if (result === undefined || !feedback.isMounted()) return;
  // Failed writes retain generated IDs so retrying cannot create another partial Deck.
  preparedImportRef.current = undefined;
  showToast({ message: `Imported ${String(result.created)} card${result.created === 1 ? "" : "s"}.`, tone: "success" });
  return result;
};
