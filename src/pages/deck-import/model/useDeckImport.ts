import { useEffect, useRef, useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { usePreferences } from "@/entities/preference";
import { addSampleDeck } from "@/features/sample-import";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";
import type { DeckImportResult, DeckImportStorageMode } from "./useDeckImportExecution";
import { useDeckImportExecution } from "./useDeckImportExecution";
import { useDeckImportPreview } from "./useDeckImportPreview";

type DeckImportStatus = "idle" | "validating" | "importing" | "adding-sample";
type DeckImportSaveStatus = Extract<DeckImportStatus, "importing" | "adding-sample">;

const cardCount = (count: number) => `${String(count)} card${count === 1 ? "" : "s"}`;

const errorDetail = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

export const useDeckImport = () => {
  const uid = useAuthUid();
  const preferences = usePreferences();
  const execution = useDeckImportExecution(uid);
  const preview = useDeckImportPreview(uid);
  const [status, setStatus] = useState<DeckImportStatus>("idle");
  const isMounted = useMountedGuard();
  const errorToastId = useRef<ToastId | undefined>(undefined);

  const dismissErrorToast = () => {
    if (errorToastId.current === undefined) return;
    dismissToast(errorToastId.current);
    errorToastId.current = undefined;
  };

  const selectFile = async (file: File) => {
    dismissErrorToast();
    setStatus("validating");
    try {
      await preview.selectFile(file);
    } finally {
      if (isMounted()) setStatus("idle");
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (preview.setStorageMode(storageMode)) dismissErrorToast();
  };

  const runSave = async (
    nextStatus: DeckImportSaveStatus,
    operation: () => Promise<DeckImportResult>,
    failureMessage: (error: unknown) => string
  ) => {
    dismissErrorToast();
    preview.clearError();
    setStatus(nextStatus);
    let result: DeckImportResult | undefined;
    try {
      result = await operation();
    } catch (error) {
      // Import persistence can outlive this route; only the owning mounted instance may publish its failure.
      if (isMounted()) errorToastId.current = showToast({ message: failureMessage(error), tone: "error" });
    } finally {
      if (isMounted()) setStatus("idle");
    }
    return result;
  };

  const importPreview = async () => {
    const result = await runSave(
      "importing",
      () => execution.runPrepared(preview.getPreparedImport),
      (error) => `Import failed. ${errorDetail(error, "The import could not be completed.")}`
    );
    if (result === undefined || !isMounted()) return;
    // Failed writes retain generated IDs so retrying cannot create another partial Deck.
    preview.completePreparedImport();
    showToast({ message: `Imported ${cardCount(result.created)}.`, tone: "success" });
    return result;
  };

  const addSample = async () => {
    const result = await runSave(
      "adding-sample",
      () => execution.run(() => addSampleDeck(uid)),
      (error) => `Unable to add sample deck. ${errorDetail(error, "The sample deck could not be added.")}`
    );
    if (result === undefined || !isMounted()) return;
    showToast({ message: `Added sample deck with ${cardCount(result.created)}.`, tone: "success" });
    return result;
  };

  useEffect(
    () => () => {
      if (errorToastId.current !== undefined) dismissToast(errorToastId.current);
    },
    []
  );

  return {
    selectFile,
    setStorageMode,
    importPreview,
    addSample,
    storageMode: preview.storageMode,
    preview: preview.preview,
    validating: status === "validating",
    pending: status === "importing",
    addingSample: status === "adding-sample",
    previewError: preview.error,
    dark: preferences.appearance.darkMode,
  };
};
