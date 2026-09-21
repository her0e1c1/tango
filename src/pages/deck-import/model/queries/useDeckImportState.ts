import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { deckImportStore, type DeckImportState } from "../store";
import { getDeckImportCardPreview } from "./getDeckImportCardPreview";

const selectDeckImportView = (state: DeckImportState) => ({
  preview: state.source.kind === "selected" ? state.source.preview : undefined,
  previewError: state.source.kind === "error" ? state.source.error : undefined,
  validating: state.status === "validating",
  pending: state.status === "importing",
});

export function useDeckImportState() {
  const view = useStore(deckImportStore, useShallow(selectDeckImportView));
  const preview = view.preview
    ? {
        ...view.preview,
        analysis: {
          ...view.preview.analysis,
          rows: view.preview.analysis.rows.map((row) => ({ ...row, card: getDeckImportCardPreview(row.card) })),
        },
      }
    : undefined;
  return { ...view, preview };
}
