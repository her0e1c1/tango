import type { SyncedQueryResult } from "@/shared/api";
import { deckStore } from "../store";
import type { Deck } from "../types";

export function applyDeckSnapshot(scope: string, result: SyncedQueryResult<Deck | null>) {
  const sync = { ...deckStore.getState().sync };
  if (result.checkpoint === null) delete sync[scope];
  else if (result.checkpoint) sync[scope] = result.checkpoint;
  return deckStore.setState({
    remoteDecks: result.values.filter((deck) => deck !== null).sort((left, right) => left.id.localeCompare(right.id)),
    ...(result.checkpoint !== undefined ? { sync } : {}),
  });
}
