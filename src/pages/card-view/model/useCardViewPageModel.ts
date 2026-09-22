import { useCardViewState } from "./queries/useCardViewState";
import { getMemoryState } from "./queries/getMemoryState";
import { useSnapshotTime } from "./useSnapshotTime";

export function useCardViewPageModel(cardId: string) {
  const state = useCardViewState(cardId);
  const at = useSnapshotTime(cardId, state?.fsrs ?? null);
  const memory = getMemoryState(state?.fsrs ?? null, at);
  return state === undefined ? undefined : { ...state, memory };
}
