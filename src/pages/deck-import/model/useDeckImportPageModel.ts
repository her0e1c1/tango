import { useNavigate } from "react-router-dom";

import { usePreferences } from "@/entities/preference";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { routes } from "@/shared/router";

import { addSampleImport as addSampleImportAction } from "./actions/addSampleImport";
import { changeDeckImportStorageMode } from "./actions/changeDeckImportStorageMode";
import { importDeckPreview as importDeckPreviewAction } from "./actions/importDeckPreview";
import { selectDeckImportFile } from "./actions/selectDeckImportFile";
import { useDeckImportState } from "./queries/useDeckImportState";

export function useDeckImportPageModel() {
  const view = useDeckImportState();
  const preferences = usePreferences();
  const navigate = useNavigate();
  const isMounted = useMountedGuard();

  const importPreview = async (): Promise<void> => {
    if (!(await importDeckPreviewAction())) return;
    // Persistence survives navigation, but an old Page must not redirect the current route.
    if (!isMounted()) return;
    void navigate(routes.deckList.to());
  };
  const addSample = async (): Promise<void> => {
    if (!(await addSampleImportAction())) return;
    if (!isMounted()) return;
    void navigate(routes.deckList.to());
  };
  return {
    view,
    dark: preferences.appearance.darkMode,
    selectFile: (file: File) => void selectDeckImportFile(file),
    changeStorageMode: changeDeckImportStorageMode,
    importPreview: () => void importPreview(),
    addSample: () => void addSample(),
  };
}
