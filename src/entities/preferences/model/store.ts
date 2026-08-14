import { createStore } from "zustand/vanilla";

import { defaultPreferences, type Preferences } from "./preferences";
import { preferencesSchema } from "./schema";

type PreferencesSection = keyof Preferences;

type BooleanPreferenceKey<S extends PreferencesSection> = {
  [Key in keyof Preferences[S]]: Preferences[S][Key] extends boolean ? Key : never;
}[keyof Preferences[S]];

type PartialPreferences = {
  [K in keyof Preferences]?: Partial<Preferences[K]>;
};

export interface PreferencesStoreState {
  preferences: Preferences;
  updatePreferences: (preferences: PartialPreferences) => void;
  togglePreference: <S extends PreferencesSection>(section: S, key: BooleanPreferenceKey<S>) => void;
}

const createInitialPreferences = (): Preferences => ({
  ...defaultPreferences,
  appearance: { ...defaultPreferences.appearance },
  study: { ...defaultPreferences.study, selectedTags: [...defaultPreferences.study.selectedTags] },
  controls: { ...defaultPreferences.controls },
});

const createPreferencesStore = () =>
  createStore<PreferencesStoreState>()((set) => ({
    preferences: createInitialPreferences(),
    updatePreferences: (preferencesInput) =>
      set((state) => {
        const merged = {
          appearance: { ...state.preferences.appearance, ...preferencesInput.appearance },
          study: {
            ...state.preferences.study,
            ...preferencesInput.study,
            selectedTags:
              preferencesInput.study?.selectedTags == null
                ? state.preferences.study.selectedTags
                : [...preferencesInput.study.selectedTags],
          },
          controls: { ...state.preferences.controls, ...preferencesInput.controls },
        };
        return { preferences: preferencesSchema.parse(merged) };
      }),
    togglePreference: (section, key) =>
      set((state) => ({
        preferences: {
          ...state.preferences,
          [section]: {
            ...state.preferences[section],
            [key]: !state.preferences[section][key],
          },
        },
      })),
  }));

export const preferencesStore = createPreferencesStore();

export const updatePreferences: PreferencesStoreState["updatePreferences"] = (preferences) =>
  preferencesStore.getState().updatePreferences(preferences);

export const setDarkMode = (darkMode: boolean): void => updatePreferences({ appearance: { darkMode } });

export const toggleShowHeader = (): void => preferencesStore.getState().togglePreference("appearance", "showHeader");

export const toggleShowSwipeButtonList = (): void =>
  preferencesStore.getState().togglePreference("controls", "showSwipeButtonList");
