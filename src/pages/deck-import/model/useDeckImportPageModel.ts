import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";
import { useAsync, useKey, useUnmount } from "react-use";

import { usePreferences } from "@/entities/preference";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { routes } from "@/shared/router";

import type { DeckImportExampleId } from "../lib/examples";
import { selectDeckImportExample } from "./actions/selectDeckImportExample";
import { downloadDeckImportExample } from "./actions/downloadDeckImportExample";
import { importDeckPreview as importDeckPreviewAction } from "./actions/importDeckPreview";
import { selectDeckImportFile } from "./actions/selectDeckImportFile";
import { useDeckImportState } from "./queries/useDeckImportState";
import { getDeckImportExamples } from "./queries/getDeckImportExamples";
import { resetDeckImportSelection } from "./actions/resetDeckImportSelection";
import { completeDeckImport } from "./actions/completeDeckImport";
import { deckImportStore } from "./store";

const examples = getDeckImportExamples();

export function useDeckImportPageModel() {
  const view = useDeckImportState();
  const preferences = usePreferences();
  const navigate = useNavigate();
  const isMounted = useMountedGuard();
  const initiatedHere = useRef<boolean>(false);
  const completion = useRef<AbortController | undefined>(undefined);
  useUnmount(() => completion.current?.abort());
  const pendingImport = useStore(deckImportStore, (state) =>
    state.status === "importing" && state.source.kind === "selected" ? state.source.preparedImport : undefined
  );
  useKey("t", () => void navigate(routes.deckList.to()));
  useKey("s", () => void navigate(routes.settings.to()));

  const importPreview = (): void => {
    if (view.pending) return;
    initiatedHere.current = true;
    void importDeckPreviewAction();
  };
  useAsync(async () => {
    completion.current?.abort();
    const controller = new AbortController();
    completion.current = controller;
    if (pendingImport === undefined || !(await completeDeckImport(controller.signal))) return;
    if (initiatedHere.current && isMounted()) void navigate(routes.deckList.to());
    initiatedHere.current = false;
  }, [isMounted, navigate, pendingImport]);
  return {
    view,
    dark: preferences.appearance.darkMode,
    selectFile: (file: File) => void selectDeckImportFile(file),
    chooseAgain: resetDeckImportSelection,
    importPreview,
    examples,
    selectExample: (id: DeckImportExampleId) => void selectDeckImportExample(id),
    downloadExample: downloadDeckImportExample,
  };
}
