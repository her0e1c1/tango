import { preferencesSchema } from "./schema";
import type { Preferences } from "./types";

const preferences = preferencesSchema.parse({});
// Store creation and recovery share these defaults, so freeze every mutable branch to prevent cross-reset mutation.
Object.freeze(preferences.study.selectedTags);
Object.freeze(preferences.appearance);
Object.freeze(preferences.study);
Object.freeze(preferences.controls);

export const defaultPreferences: Preferences = Object.freeze(preferences);
