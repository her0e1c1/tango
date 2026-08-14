import { preferencesSchema } from "./schema";
import type { Preferences } from "./types";

const preferences = preferencesSchema.parse({});
Object.freeze(preferences.study.selectedTags);
Object.freeze(preferences.appearance);
Object.freeze(preferences.study);
Object.freeze(preferences.controls);

export const defaultPreferences: Preferences = Object.freeze(preferences);
