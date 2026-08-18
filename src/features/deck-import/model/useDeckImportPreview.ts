import type { Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";

import { useRef, useState } from "react";

import { fetchCards, generateCardId } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { type DeckImportAnalysis, parseCsv } from "../lib/cardCsv";
import type {
  DeckImportDestination,
  DeckImportDestinationOption,
  DeckImportStorageMode,
  PreparedDeckImport,
} from "./useDeckImportExecution";
import { prepareDeckImport } from "./useDeckImportExecution";

export interface DeckImportPreview {
  deckName: string;
  destinationLabel: string;
  analysis: DeckImportAnalysis;
  plan: PreparedDeckImport["plan"] | undefined;
}

export type DeckImportDestinationType = DeckImportDestination["type"];

interface DeckImportPreviewState {
  storageMode: DeckImportStorageMode;
  destinationType: DeckImportDestinationType;
  destinationDeckId: DeckId | undefined;
  preview: DeckImportPreview | undefined;
  error: unknown;
}

interface PreparedDeckImportState {
  preparedImport: PreparedDeckImport | undefined;
  revision: number;
}

interface UseDeckImportPreviewOptions {
  uid: string;
  decks: Deck[];
  cards: Card[];
}

const initialState = (): DeckImportPreviewState => ({
  storageMode: "remote",
  destinationType: "new",
  destinationDeckId: undefined,
  preview: undefined,
  error: null,
});

const createPreparedImportState = (): PreparedDeckImportState => ({ preparedImport: undefined, revision: 0 });

const loadDestinationData = async (
  destination: DeckImportDestination,
  storageMode: DeckImportStorageMode,
  uid: string,
  localData: { decks: Deck[]; cards: Card[] }
) => {
  if (destination.type === "new") return { decks: [], cards: [] };
  if (storageMode === "local") return localData;

  // Existing remote imports must not plan against listener state that may lag a deletion or Card edit.
  const [decks, cards] = await Promise.all([fetchDecks(uid), fetchCards(uid)]);
  return { decks, cards };
};

const selectDestination = (
  destinationType: DeckImportDestinationType,
  destinationDeckId: DeckId | undefined,
  fileName: string
): DeckImportDestination => {
  if (destinationType === "new") return { type: "new", name: fileName };
  if (destinationDeckId === undefined) throw new Error("Choose an existing Deck before selecting a CSV file");
  return { type: "existing", deckId: destinationDeckId };
};

const destinationLabel = (destination: DeckImportDestination, decks: Deck[]) => {
  if (destination.type === "new") return destination.name;
  return decks.find((deck) => deck.id === destination.deckId)?.name ?? destination.deckId;
};

export const useDeckImportPreview = ({ uid, decks, cards }: UseDeckImportPreviewOptions) => {
  const preparedImportRef = useRef<PreparedDeckImportState>(createPreparedImportState());
  const [state, setState] = useState<DeckImportPreviewState>(initialState);
  const updateState = (update: Partial<DeckImportPreviewState>) => {
    setState((current) => ({ ...current, ...update }));
  };
  const invalidatePreparedImport = () => {
    preparedImportRef.current.preparedImport = undefined;
    preparedImportRef.current.revision += 1;
  };

  const selectFile = async (file: File) => {
    invalidatePreparedImport();
    const { revision } = preparedImportRef.current;
    const { storageMode, destinationType, destinationDeckId } = state;
    updateState({ preview: undefined, error: null });

    try {
      const destination = selectDestination(destinationType, destinationDeckId, file.name);
      const analysis = await parseCsv(await file.text());
      const destinationData = await loadDestinationData(destination, storageMode, uid, { decks, cards });
      if (revision !== preparedImportRef.current.revision) {
        throw new Error("The import destination changed while preparing the preview");
      }

      const preparedImport = prepareDeckImport(
        { destination, rows: analysis.rows, storageMode },
        { uid, ...destinationData, generateCardId }
      );
      const preview: DeckImportPreview = {
        deckName: file.name,
        destinationLabel: destinationLabel(destination, destinationData.decks),
        analysis,
        plan: destination.type === "existing" ? preparedImport.plan : undefined,
      };
      preparedImportRef.current.preparedImport = preparedImport;
      updateState({ preview });
      return preview;
    } catch (caughtError) {
      if (revision === preparedImportRef.current.revision) updateState({ error: caughtError });
      throw caughtError;
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (state.storageMode === storageMode) return false;

    invalidatePreparedImport();
    updateState({ storageMode, destinationDeckId: undefined, preview: undefined, error: null });
    return true;
  };

  const setDestinationType = (destinationType: DeckImportDestinationType) => {
    if (state.destinationType === destinationType) return false;

    invalidatePreparedImport();
    updateState({ destinationType, destinationDeckId: undefined, preview: undefined, error: null });
    return true;
  };

  const setDestinationDeckId = (destinationDeckId: DeckId) => {
    if (state.destinationDeckId === destinationDeckId) return false;

    invalidatePreparedImport();
    updateState({ destinationDeckId, preview: undefined, error: null });
    return true;
  };

  const getPreparedImport = () => {
    const { preview } = state;
    if (preview == null) throw new Error("Select a CSV file before importing");
    if (preview.analysis.invalidCount > 0) throw new Error("Fix invalid CSV rows before importing");
    if (preview.analysis.rows.length === 0) throw new Error("The CSV file has no valid rows");
    if (preparedImportRef.current.preparedImport == null) {
      throw new Error("The prepared Deck import is not available");
    }

    return preparedImportRef.current.preparedImport;
  };

  const destinationOptions: DeckImportDestinationOption[] = decks
    .filter((deck) => deck.localMode === (state.storageMode === "local"))
    .map((deck) => ({ id: deck.id, label: deck.name }));

  return {
    selectFile,
    setStorageMode,
    setDestinationType,
    setDestinationDeckId,
    getPreparedImport,
    completePreparedImport: invalidatePreparedImport,
    clearError: () => updateState({ error: null }),
    storageMode: state.storageMode,
    destinationType: state.destinationType,
    destinationDeckId: state.destinationDeckId,
    destinationOptions,
    preview: state.preview,
    error: state.error,
  };
};
