import { beforeEach, describe, expect, it } from "vitest";

import { defaultPreferences } from "./preferences";
import { preferencesStore } from "./store";

describe("preferences store", () => {
  beforeEach(() => {
    preferencesStore.getState().updatePreferences(defaultPreferences);
  });

  it("updates each preference group without resetting other settings", () => {
    const store = preferencesStore;

    store.getState().updatePreferences({
      appearance: { darkMode: true },
      study: { cardInterval: 15 },
      controls: { showScoreSlider: true },
    });
    store.getState().updatePreferences({ appearance: { showHeader: false } });
    store.getState().togglePreference("appearance", "darkMode");

    expect(store.getState().preferences).toEqual({
      ...defaultPreferences,
      study: { ...defaultPreferences.study, cardInterval: 15 },
      appearance: { ...defaultPreferences.appearance, darkMode: false, showHeader: false },
      controls: { ...defaultPreferences.controls, showScoreSlider: true },
    });
  });

  it("validates numeric ranges during updates", () => {
    const store = preferencesStore;

    store.getState().updatePreferences({
      study: { maxNumberOfCardsToLearn: 101, cardInterval: -1 },
      appearance: { sizeBackText: -1 },
    });

    expect(store.getState().preferences.study.maxNumberOfCardsToLearn).toBe(
      defaultPreferences.study.maxNumberOfCardsToLearn
    );
    expect(store.getState().preferences.study.cardInterval).toBe(defaultPreferences.study.cardInterval);
    expect(store.getState().preferences.appearance.sizeBackText).toBe(defaultPreferences.appearance.sizeBackText);
  });
});
