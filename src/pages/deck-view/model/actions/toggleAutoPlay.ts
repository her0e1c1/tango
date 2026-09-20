import { deckViewStore } from "../store";

export function toggleAutoPlay(): void {
  deckViewStore.setState((state) => ({ autoPlay: !state.autoPlay }));
}
