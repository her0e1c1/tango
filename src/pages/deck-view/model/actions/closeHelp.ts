import { deckViewStore } from "../store";

export function closeHelp(): void {
  deckViewStore.setState({ helpOpen: false });
}
