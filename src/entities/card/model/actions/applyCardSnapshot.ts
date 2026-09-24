import type { SyncedQueryResult } from "@/shared/api";
import { cardStore } from "../store";
import type { RemoteCard } from "../types";

export function applyCardSnapshot(scope: string, result: SyncedQueryResult<RemoteCard>) {
  const sync = { ...cardStore.getState().sync };
  if (result.checkpoint === null) delete sync[scope];
  else if (result.checkpoint) sync[scope] = result.checkpoint;
  return cardStore.setState({
    remoteCards: result.values
      .filter((card) => card.deletedAt === null)
      .sort((left, right) => left.id.localeCompare(right.id)),
    ...(result.checkpoint !== undefined ? { sync } : {}),
  });
}
