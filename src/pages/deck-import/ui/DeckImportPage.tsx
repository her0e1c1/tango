import type React from "react";

import { AppLayout } from "@/widgets/app-layout";
import { useDeckImportPageModel } from "../model/useDeckImportPageModel";
import { DeckImportView } from "./DeckImportView";

export const DeckImportPage: React.FC = () => {
  const model = useDeckImportPageModel();

  return (
    <AppLayout showHeader>
      <DeckImportView
        {...model.view}
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
