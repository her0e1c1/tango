import { studySessionPageStore } from "../store";

export function closeHelp(): void {
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, helpOpen: false },
  }));
}
