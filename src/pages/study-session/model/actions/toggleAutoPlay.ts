import { studySessionPageStore } from "../store";

export function toggleAutoPlay(): void {
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, autoPlay: !state.pageState.autoPlay },
  }));
}
