import type { Dispatch, RefObject, SetStateAction } from "react";
import { showToast, type ToastId, type ToastMessage } from "@/shared/ui/toast";
import type { DeckImportPreviewState, DeckImportResult, DeckImportStatus } from "../types";
import { dismissImportError } from "./dismissImportError";

export interface DeckImportSaveFeedback {
  setPreviewState: Dispatch<SetStateAction<DeckImportPreviewState>>;
  setStatus: (status: DeckImportStatus) => void;
  errorToastId: RefObject<ToastId | undefined>;
  isMounted: () => boolean;
}

export const runDeckImportSave = async (
  status: "importing" | "adding-sample",
  operation: () => Promise<DeckImportResult>,
  failureMessage: (error: unknown) => ToastMessage,
  { setPreviewState, setStatus, errorToastId, isMounted }: DeckImportSaveFeedback
): Promise<DeckImportResult | undefined> => {
  dismissImportError(errorToastId);
  setPreviewState((current) => ({ ...current, error: null }));
  setStatus(status);
  try {
    return await operation();
  } catch (error) {
    // Persistence may outlive the route; only its mounted owner may publish a failure.
    if (isMounted()) errorToastId.current = showToast({ ...failureMessage(error), tone: "error" });
    return undefined;
  } finally {
    if (isMounted()) setStatus("idle");
  }
};
