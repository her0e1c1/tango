import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { downloadSampleCsv, SAMPLE_CSV_TEXT } from "../lib/sampleCsv";
import { useDeckImportPageModel } from "../model/useDeckImportPageModel";
import { DeckImportView } from "./DeckImportView";

export const DeckImportPage: React.FC = () => {
  const navigate = useNavigate();
  const model = useDeckImportPageModel();
  useKey("t", () => void navigate(routes.deckList.to()));
  useKey("s", () => void navigate(routes.settings.to()));

  return (
    <AppLayout showHeader>
      <DeckImportView
        {...model.view}
        onStorageModeChange={model.changeStorageMode}
        onChange={model.selectFile}
        onAddSample={model.addSample}
        onImport={model.importPreview}
        onDownloadSample={downloadSampleCsv}
        dark={model.dark}
        sampleText={SAMPLE_CSV_TEXT}
      />
    </AppLayout>
  );
};
