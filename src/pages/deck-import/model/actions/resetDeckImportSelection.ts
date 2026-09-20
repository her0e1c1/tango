import { deckImportStore } from "../store";

export function resetDeckImportSelection(): void {
  if (deckImportStore.getState().status !== "idle") return;
  deckImportStore.setState({ source: { kind: "empty" } });
}
