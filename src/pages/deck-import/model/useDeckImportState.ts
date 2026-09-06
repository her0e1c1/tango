import { useEffect, useRef, useState } from "react";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, type ToastId } from "@/shared/ui/toast";
import type { DeckImportPreviewState, DeckImportStatus, PreparedDeckImport } from "./types";

export const useDeckImportState = () => {
  const [status, setStatus] = useState<DeckImportStatus>("idle");
  const [previewState, setPreviewState] = useState<DeckImportPreviewState>({ storageMode: "remote", error: null });
  const preparedImportRef = useRef<PreparedDeckImport | undefined>(undefined);
  const errorToastId = useRef<ToastId | undefined>(undefined);
  const isMounted = useMountedGuard();
  useEffect(
    () => () => {
      if (errorToastId.current !== undefined) dismissToast(errorToastId.current);
    },
    []
  );
  return { status, setStatus, previewState, setPreviewState, preparedImportRef, errorToastId, isMounted };
};
