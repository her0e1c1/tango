import { getPreferences, toggleViewMode } from "@/entities/preference";
import { studySessionPageStore } from "../store";

export function toggleBackText(): void {
  if (!studySessionPageStore.getState().pageState.showBackText && getPreferences().controls.viewMode) {
    toggleViewMode();
    return;
  }
  studySessionPageStore.setState((state) => ({
    pageState: { ...state.pageState, showBackText: !state.pageState.showBackText },
  }));
}
