import { studySessionPageStore } from "../store";

export function toggleBackText(): void {
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, showBackText: !state.pageState.showBackText },
  }));
}
