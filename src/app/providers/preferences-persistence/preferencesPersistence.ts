import type { StoreApi } from "zustand/vanilla";

import {
  defaultPreferences,
  preferencesSchema,
  preferencesStore,
  type Preferences,
  type PreferencesStoreState,
} from "@/entities/preferences";

const PREFERENCES_STORAGE_KEY = "tango-config";
const PREFERENCES_STORAGE_VERSION = 3;

const getRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const normalizeAppearance = (section: Record<string, unknown>, root: Record<string, unknown>) => ({
  darkMode: section.darkMode ?? root.darkMode,
  showHeader: section.showHeader ?? root.showHeader,
  fullscreen: section.fullscreen ?? root.fullscreen,
  sizeBackText: section.sizeBackText ?? root.sizeBackText,
  hideBodyWhenCardChanged: section.hideBodyWhenCardChanged ?? root.hideBodyWhenCardChanged,
  showSwipeFeedback: section.showSwipeFeedback ?? root.showSwipeFeedback,
});

const normalizeStudy = (section: Record<string, unknown>, root: Record<string, unknown>) => ({
  maxNumberOfCardsToLearn: section.maxNumberOfCardsToLearn ?? root.maxNumberOfCardsToLearn,
  shuffled: section.shuffled ?? root.shuffled,
  useCardInterval: section.useCardInterval ?? root.useCardInterval,
  cardInterval: section.cardInterval ?? root.cardInterval,
  keepBackTextViewed: section.keepBackTextViewed ?? root.keepBackTextViewed,
  defaultAutoPlay: section.defaultAutoPlay ?? root.defaultAutoPlay,
  selectedTags: section.selectedTags ?? root.selectedTags,
});

const normalizeControls = (section: Record<string, unknown>, root: Record<string, unknown>) => ({
  showSwipeButtonList: section.showSwipeButtonList ?? root.showSwipeButtonList,
  showScoreSlider: section.showScoreSlider ?? root.showScoreSlider,
  cardSwipeUp: section.cardSwipeUp ?? root.cardSwipeUp,
  cardSwipeDown: section.cardSwipeDown ?? root.cardSwipeDown,
  cardSwipeLeft: section.cardSwipeLeft ?? root.cardSwipeLeft,
  cardSwipeRight: section.cardSwipeRight ?? root.cardSwipeRight,
});

const unwrapPersistedPreferences = (input: unknown): unknown => {
  const envelope = getRecord(input);
  const state = getRecord(envelope.state);
  return state.preferences ?? state.config ?? envelope.preferences ?? envelope.config ?? input;
};

const parsePersistedPreferences = (input: unknown): Preferences => {
  const rawPreferences = unwrapPersistedPreferences(input);
  if (typeof rawPreferences !== "object" || rawPreferences === null) return defaultPreferences;

  const root = getRecord(rawPreferences);
  return preferencesSchema.parse({
    appearance: normalizeAppearance(getRecord(root.appearance), root),
    study: normalizeStudy(getRecord(root.study), root),
    controls: normalizeControls(getRecord(root.controls), root),
  });
};

const serializePreferences = (preferences: Preferences): string =>
  JSON.stringify({ state: { preferences }, version: PREFERENCES_STORAGE_VERSION });

export const startPreferencesPersistence = (
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
  store: StoreApi<PreferencesStoreState> = preferencesStore
): (() => void) => {
  const persistedValue = storage.getItem(PREFERENCES_STORAGE_KEY);
  if (persistedValue != null) {
    try {
      store.getState().updatePreferences(parsePersistedPreferences(JSON.parse(persistedValue)));
    } catch {
      store.getState().updatePreferences(defaultPreferences);
    }
  }

  return store.subscribe((state, previousState) => {
    if (state.preferences !== previousState.preferences) {
      storage.setItem(PREFERENCES_STORAGE_KEY, serializePreferences(state.preferences));
    }
  });
};
