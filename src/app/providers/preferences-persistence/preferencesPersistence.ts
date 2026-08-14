import { defaultPreferences, preferencesSchema, preferencesStore, type Preferences } from "@/entities/preferences";

const PREFERENCES_STORAGE_KEY = "tango-config";
const PREFERENCES_STORAGE_VERSION = 3;

const getRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const unwrapPersistedPreferences = (input: unknown): unknown => {
  const envelope = getRecord(input);
  const state = getRecord(envelope.state);
  return state.preferences ?? state.config ?? envelope.preferences ?? envelope.config ?? input;
};

const parsePersistedPreferences = (input: unknown): Preferences => {
  const rawPreferences = getRecord(unwrapPersistedPreferences(input));
  const nested = ["appearance", "study", "controls"].some((section) => section in rawPreferences);

  return preferencesSchema.parse(
    nested ? rawPreferences : { appearance: rawPreferences, study: rawPreferences, controls: rawPreferences }
  );
};

const serializePreferences = (preferences: Preferences): string =>
  JSON.stringify({ state: { preferences }, version: PREFERENCES_STORAGE_VERSION });

export const startPreferencesPersistence = (
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage
): (() => void) => {
  const persistedValue = storage.getItem(PREFERENCES_STORAGE_KEY);
  if (persistedValue != null) {
    try {
      preferencesStore.getState().updatePreferences(parsePersistedPreferences(JSON.parse(persistedValue)));
    } catch {
      preferencesStore.getState().updatePreferences(defaultPreferences);
    }
  }

  return preferencesStore.subscribe((state, previousState) => {
    if (state.preferences !== previousState.preferences) {
      storage.setItem(PREFERENCES_STORAGE_KEY, serializePreferences(state.preferences));
    }
  });
};
