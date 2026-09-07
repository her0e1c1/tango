import { createStore } from "zustand/vanilla";
import type { DeckImportSourceState, DeckImportStatus, DeckImportStorageMode, PreparedDeckImport } from "./types";

export interface DeckImportState {
  storageMode: DeckImportStorageMode;
  status: DeckImportStatus;
  source: DeckImportSourceState;
}

// Pending work and retry identities must survive leaving and re-entering the Page.
export const deckImportStore = createStore<DeckImportState>()(() => ({
  storageMode: "remote",
  status: "idle",
  source: { kind: "empty" },
}));

interface FileSelectionContext {
  storageMode: DeckImportStorageMode;
  uid: string;
}

export function beginFileSelection(uid: string): FileSelectionContext | undefined {
  const state = deckImportStore.getState();
  if (state.status !== "idle") return;
  deckImportStore.setState({ status: "validating", source: { kind: "empty" } });
  return { storageMode: state.storageMode, uid };
}

export function completeFileSelection(source: Extract<DeckImportSourceState, { kind: "selected" }>): void {
  deckImportStore.setState({ status: "idle", source });
}

export function failFileSelection(error: unknown): void {
  deckImportStore.setState({ status: "idle", source: { kind: "error", error } });
}

export function cancelFileSelection(): void {
  deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
}

interface ImportContext {
  preparedImport: PreparedDeckImport;
  uid: string;
}

export function beginImport(uid: string): ImportContext | undefined {
  const state = deckImportStore.getState();
  if (state.status !== "idle") return;
  if (state.source.kind !== "selected") return;
  if (state.source.preparedImport === undefined) return;
  // Acquire the shared lock before exposing the snapshot to asynchronous persistence.
  deckImportStore.setState({ status: "importing" });
  return { preparedImport: state.source.preparedImport, uid };
}

export function completeImport(): void {
  deckImportStore.setState({ status: "idle", source: { kind: "empty" } });
}

export function failImport(): void {
  // Keep source so explicit retries reuse the same Deck/Card IDs after partial writes.
  deckImportStore.setState({ status: "idle" });
}

export function beginSampleImport(): boolean {
  if (deckImportStore.getState().status !== "idle") return false;
  deckImportStore.setState({ status: "adding-sample" });
  return true;
}

export function completeSampleImport(): void {
  deckImportStore.setState({ status: "idle" });
}

export function failSampleImport(): void {
  deckImportStore.setState({ status: "idle" });
}

export function changeStorageMode(storageMode: DeckImportStorageMode): boolean {
  const state = deckImportStore.getState();
  if (state.status !== "idle" || state.storageMode === storageMode) return false;
  deckImportStore.setState({ storageMode, source: { kind: "empty" } });
  return true;
}
