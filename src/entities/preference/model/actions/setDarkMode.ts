import { updatePreferences } from "./updatePreferences";

// Sets the appearance color mode preference explicitly.
export const setDarkMode = (darkMode: boolean): void => updatePreferences({ appearance: { darkMode } });
