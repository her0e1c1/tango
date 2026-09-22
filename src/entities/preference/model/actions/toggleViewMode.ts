import { getPreferences } from "../queries/getPreferences";
import { updatePreferences } from "./updatePreferences";

export function toggleViewMode(): void {
  updatePreferences({ controls: { viewMode: !getPreferences().controls.viewMode } });
}
