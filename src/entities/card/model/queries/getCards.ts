import { cardStore } from "../store";
import type { Card } from "../types";

export function getCards(): Card[] {
  const state = cardStore.getState();
  return [...state.remoteCards, ...state.localCards];
}
