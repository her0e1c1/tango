import { studySessionPageStore } from "../store";

export function toggleAutoPlay(): void {
  const { pendingWork, pendingOperation } = studySessionPageStore.getState();
  if (pendingWork !== undefined || pendingOperation !== undefined) return;
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, autoPlay: !state.pageState.autoPlay },
  }));
}
