import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { usePreferences } from "@/entities/preference";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { routes } from "@/shared/router";

import type { DeckImportExampleId } from "../lib/examples";
import { selectDeckImportExample } from "./actions/selectDeckImportExample";
import { downloadDeckImportExample } from "./actions/downloadDeckImportExample";
import { changeDeckImportStorageMode } from "./actions/changeDeckImportStorageMode";
import { importDeckPreview as importDeckPreviewAction } from "./actions/importDeckPreview";
import { selectDeckImportFile } from "./actions/selectDeckImportFile";
import { useDeckImportState } from "./queries/useDeckImportState";
import { getDeckImportExamples } from "./queries/getDeckImportExamples";
import { resetDeckImportSelection } from "./actions/resetDeckImportSelection";

const examples = getDeckImportExamples();

export function useDeckImportPageModel() {
  const view = useDeckImportState();
  const preferences = usePreferences();
  const navigate = useNavigate();
  const isMounted = useMountedGuard();
  useKey("t", () => void navigate(routes.deckList.to()));
  useKey("s", () => void navigate(routes.settings.to()));

  const importPreview = async (): Promise<void> => {
    if (!(await importDeckPreviewAction())) return;
    // Persistence survives navigation, but an old Page must not redirect the current route.
    if (!isMounted()) return;
    void navigate(routes.deckList.to());
  };
  return {
    view,
    dark: preferences.appearance.darkMode,
    selectFile: (file: File) => void selectDeckImportFile(file),
    chooseAgain: resetDeckImportSelection,
    changeStorageMode: changeDeckImportStorageMode,
    importPreview: () => void importPreview(),
    examples,
    selectExample: (id: DeckImportExampleId) => void selectDeckImportExample(id),
    downloadExample: downloadDeckImportExample,
  };
}
