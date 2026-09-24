import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";
import { useKey } from "react-use";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { routes } from "@/shared/router";
import { showToast } from "@/shared/ui/toast";

import type { DeckImportExampleId } from "../lib/examples";
import { selectDeckImportExample } from "./actions/selectDeckImportExample";
import { downloadDeckImportExample } from "./actions/downloadDeckImportExample";
import { importDeckPreview as importDeckPreviewAction } from "./actions/importDeckPreview";
import { selectDeckImportFile } from "./actions/selectDeckImportFile";
import { useDeckImportState } from "./queries/useDeckImportState";
import { getDeckImportExamples } from "./queries/getDeckImportExamples";
import { resetDeckImportSelection } from "./actions/resetDeckImportSelection";
import { deckImportStore } from "./store";

const examples = getDeckImportExamples();

export function useDeckImportPageModel() {
  const view = useDeckImportState();
  const preferences = usePreferences();
  const navigate = useNavigate();
  const isMounted = useMountedGuard();
  const decks = useDecks();
  const cards = useCards();
  const pendingImport = useStore(deckImportStore, (state) =>
    state.status === "importing" && state.source.kind === "selected" ? state.source.preparedImport : undefined
  );
  useKey("t", () => void navigate(routes.deckList.to()));
  useKey("s", () => void navigate(routes.settings.to()));

  const importPreview = (): void => {
    importDeckPreviewAction();
  };
  useEffect(() => {
    if (pendingImport === undefined) return;
    const deckReady = decks.some((deck) => deck.id === pendingImport.destination.id);
    const cardIds = pendingImport.mutations.flatMap((mutation) =>
      mutation.kind === "create" ? [mutation.card.id] : []
    );
    if (!deckReady || cardIds.some((id) => !cards.some((card) => card.id === id))) return;
    showToast({
      messageKey: "deckImport.toast.imported",
      messageParams: { count: cardIds.length },
      tone: "success",
    });
    deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
    if (isMounted()) void navigate(routes.deckList.to());
  }, [cards, decks, isMounted, navigate, pendingImport]);
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
