import { studySessionPageStore } from "../store";

export function openHelp(): void {
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, helpOpen: true },
  }));
}
