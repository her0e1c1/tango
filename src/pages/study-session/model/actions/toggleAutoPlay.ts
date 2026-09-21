import { studySessionPageStore } from "../store";

export function toggleAutoPlay(): void {
  const { isSaving } = studySessionPageStore.getState();
  if (isSaving) return;
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, autoPlay: !state.pageState.autoPlay },
  }));
}
