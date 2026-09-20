import { deckViewStore } from "../store";

export function openHelp(): void {
  deckViewStore.setState({ helpOpen: true });
}
