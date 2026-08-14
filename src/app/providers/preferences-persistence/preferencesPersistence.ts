import { defaultPreferences, preferencesSchema, preferencesStore } from "@/entities/preferences";

const PREFERENCES_STORAGE_KEY = "tango-config";

const parsePersistedPreferences = (value: string) => {
  try {
    return preferencesSchema.safeParse(JSON.parse(value));
  } catch {
    return undefined;
  }
};

export const startPreferencesPersistence = (
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage
): (() => void) => {
  const persistedValue = storage.getItem(PREFERENCES_STORAGE_KEY);
  if (persistedValue != null) {
    const result = parsePersistedPreferences(persistedValue);
    preferencesStore.getState().updatePreferences(result?.success ? result.data : defaultPreferences);
  }

  return preferencesStore.subscribe((state, previousState) => {
    if (state.preferences !== previousState.preferences) {
      storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(state.preferences));
    }
  });
};
