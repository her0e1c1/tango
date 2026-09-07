import { studySessionPageStore } from "../store";

export function hideBackText(): void {
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, showBackText: false },
  }));
}
