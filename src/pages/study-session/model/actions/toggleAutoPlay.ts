import { studySessionPageStore } from "../store";

export function toggleAutoPlay(): void {
  const { isSaving, pendingOperation } = studySessionPageStore.getState();
  if (isSaving || pendingOperation !== undefined) return;
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, autoPlay: !state.pageState.autoPlay },
  }));
}
