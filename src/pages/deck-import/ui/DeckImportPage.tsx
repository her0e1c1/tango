import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { downloadSampleCsv, SAMPLE_CSV_TEXT } from "../lib/sampleCsv";
import { useAuthUid } from "@/entities/auth";
import { usePreferences } from "@/entities/preference";
import { useDeckImportState } from "../model/useDeckImportState";
import { selectDeckImportFile } from "../model/actions/selectDeckImportFile";
import { changeDeckImportStorageMode } from "../model/actions/changeDeckImportStorageMode";
import { importDeckPreview } from "../model/actions/importDeckPreview";
import { addSampleImport } from "../model/actions/addSampleImport";
import { DeckImportView } from "./DeckImportView";

export const DeckImportPage: React.FC = () => {
  const navigate = useNavigate();
  const uid = useAuthUid();
  const preferences = usePreferences();
  const state = useDeckImportState();
  const feedback = {
    setPreviewState: state.setPreviewState,
    setStatus: state.setStatus,
    errorToastId: state.errorToastId,
    isMounted: state.isMounted,
  };
  useKey("t", () => void navigate(routes.deckList.to()));
  useKey("s", () => void navigate(routes.settings.to()));

  return (
    <AppLayout showHeader>
      <DeckImportView
        storageMode={state.previewState.storageMode}
        onStorageModeChange={(mode) =>
          changeDeckImportStorageMode(mode, {
            currentMode: state.previewState.storageMode,
            preparedImportRef: state.preparedImportRef,
            setPreviewState: state.setPreviewState,
            errorToastId: state.errorToastId,
          })
        }
        onChange={(file) => {
          void selectDeckImportFile(file, {
            uid,
            storageMode: state.previewState.storageMode,
            preparedImportRef: state.preparedImportRef,
            ...feedback,
          });
        }}
        onAddSample={() => {
          void addSampleImport(uid, feedback).then((result) => {
            if (result !== undefined) void navigate(routes.deckList.to());
          });
        }}
        onImport={() => {
          void importDeckPreview(uid, state.previewState.preview, state.preparedImportRef, feedback).then((result) => {
            if (result !== undefined) void navigate(routes.deckList.to());
          });
        }}
        onDownloadSample={downloadSampleCsv}
        validating={state.status === "validating"}
        pending={state.status === "importing"}
        addingSample={state.status === "adding-sample"}
        preview={state.previewState.preview}
        previewError={state.previewState.error}
        dark={preferences.appearance.darkMode}
        sampleText={SAMPLE_CSV_TEXT}
      />
    </AppLayout>
  );
};
