import type { DeckListEmptyReason } from "./useDeckListState";

export function getDeckListEmptyState(reason: DeckListEmptyReason | undefined, onRetry: () => void) {
  if (reason === undefined) return undefined;
  return { reason, onRetry: reason === "error" ? onRetry : undefined };
}
