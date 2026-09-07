import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { usePreferences } from "@/entities/preference";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { routes } from "@/shared/router";
import { addSampleImport as addSampleImportAction } from "./actions/addSampleImport";
import { changeDeckImportStorageMode } from "./actions/changeDeckImportStorageMode";
import { importDeckPreview as importDeckPreviewAction } from "./actions/importDeckPreview";
import { selectDeckImportFile } from "./actions/selectDeckImportFile";
import { getDeckImportView } from "./queries/getDeckImportView";
import { deckImportStore } from "./store";

export function useDeckImportPageModel() {
  const view = useStore(deckImportStore, useShallow(getDeckImportView));
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
