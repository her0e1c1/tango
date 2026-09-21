import { useCardViewState } from "./queries/useCardViewState";
import { getMemoryState } from "./queries/getMemoryState";
import { useSnapshotTime } from "./useSnapshotTime";

export function useCardViewPageModel(cardId: string) {
  const state = useCardViewState(cardId);
  const at = useSnapshotTime(cardId, state?.schedule);
  const memory = getMemoryState(state?.schedule, at);
  return state === undefined ? undefined : { ...state, memory };
}
