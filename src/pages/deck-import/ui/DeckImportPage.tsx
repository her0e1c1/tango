import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
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
        cloudStorageAvailable={model.cloudStorageAvailable}
        onStorageModeChange={model.changeStorageMode}
        onChange={model.selectFile}
        onChooseAgain={model.chooseAgain}
        onSelectExample={model.selectExample}
        onImport={model.importPreview}
        onDownloadExample={model.downloadExample}
        dark={model.dark}
        examples={model.examples}
      />
    </AppLayout>
  );
};
