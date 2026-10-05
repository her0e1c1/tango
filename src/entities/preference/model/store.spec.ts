import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StateStorage } from "zustand/middleware";

import type { PartialPreferences, Preferences } from "./types";

const defaultPreferences: Preferences = {
  loadSample: true,
  language: "system",
  appearance: {
    darkMode: false,
    fullscreen: false,
    sizeBackText: 0,
    hideBodyWhenCardChanged: true,
    showSwipeFeedback: false,
  },
  study: {
    maxNumberOfCardsToLearn: 10,
    shuffled: false,
    useCardInterval: false,
    cardInterval: 60,
    keepBackTextViewed: false,
    defaultAutoPlay: false,
    selectedTags: [],
  },
  controls: {
    viewMode: false,
    showViewMode: true,
    showHelp: true,
    showEditLink: true,
    showSwipeButtonList: true,
    showPlaybackControls: true,
    showCardDetails: true,
    showBackTextSwipeOverlays: false,
    showSkip: true,
    cardSwipeUp: "RateEasy",
    cardSwipeDown: "RateHard",
    cardSwipeLeft: "RateAgain",
    cardSwipeRight: "RateGood",
  },
};

const changedPreferences: Preferences = {
  loadSample: false,
  language: "en",
  appearance: {
    darkMode: true,
    fullscreen: true,
    sizeBackText: 3,
    hideBodyWhenCardChanged: false,
    showSwipeFeedback: true,
  },
  study: {
    maxNumberOfCardsToLearn: 25,
    shuffled: true,
    useCardInterval: true,
    cardInterval: 15,
    keepBackTextViewed: true,
    defaultAutoPlay: true,
    selectedTags: ["typescript"],
  },
  controls: {
    viewMode: true,
    showViewMode: false,
    showHelp: false,
    showEditLink: true,
    showSwipeButtonList: false,
    showPlaybackControls: false,
    showCardDetails: false,
    showBackTextSwipeOverlays: true,
    showSkip: false,
    cardSwipeUp: "GoBack",
    cardSwipeDown: "DoNothing",
    cardSwipeLeft: "RateEasy",
    cardSwipeRight: "RateHard",
  },
};

const numericPreferences: Preferences = {
  ...changedPreferences,
  appearance: { ...changedPreferences.appearance, sizeBackText: 2 },
};

type MemoryStorage = Omit<StateStorage, "getItem"> & {
  getItem: (name: string) => string | null;
};

async function loadPreferences(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage: MemoryStorage = {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => {
      values.set(name, value);
    },
    removeItem: (name) => {
      values.delete(name);
    },
  };
  vi.stubGlobal("localStorage", storage);
  // A restart must not reuse the live store or its already hydrated values.
  vi.resetModules();
  return { model: await import("./store"), storage };
}

let model: typeof import("./store");
let storage: MemoryStorage;

describe("preferences store", () => {
  beforeEach(async () => {
    ({ model, storage } = await loadPreferences());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("UNIT-STORE-PREF-01 provides standard preferences without saved settings", () => {
    expect(model.getPreferences()).toEqual(defaultPreferences);
  });

  it.each([
    {
      name: "system language",
      input: { language: "system" },
      expected: { ...changedPreferences, language: "system" },
    },
    {
      name: "English language",
      input: { language: "en" },
      expected: { ...changedPreferences, language: "en" },
    },
    {
      name: "Japanese language",
      input: { language: "ja" },
      expected: { ...changedPreferences, language: "ja" },
    },
    {
      name: "back text size",
      input: { appearance: { sizeBackText: 2 } },
      expected: {
        ...changedPreferences,
        appearance: { ...changedPreferences.appearance, sizeBackText: 2 },
      },
    },
    {
      name: "study limit",
      input: { study: { maxNumberOfCardsToLearn: 20 } },
      expected: {
        ...changedPreferences,
        study: { ...changedPreferences.study, maxNumberOfCardsToLearn: 20 },
      },
    },
    {
      name: "edit link visibility",
      input: { controls: { showEditLink: false } },
      expected: {
        ...changedPreferences,
        controls: { ...changedPreferences.controls, showEditLink: false },
      },
    },
    {
      name: "replacement tags",
      input: { study: { selectedTags: ["go"] } },
      expected: {
        ...changedPreferences,
        study: { ...changedPreferences.study, selectedTags: ["go"] },
      },
    },
    {
      name: "empty tags",
      input: { study: { selectedTags: [] } },
      expected: {
        ...changedPreferences,
        study: { ...changedPreferences.study, selectedTags: [] },
      },
    },
    {
      name: "sample loading",
      input: { loadSample: true },
      expected: { ...changedPreferences, loadSample: true },
    },
  ] satisfies { name: string; input: PartialPreferences; expected: Preferences }[])(
    "UNIT-STORE-PREF-02 updates $name while preserving unspecified settings",
    ({ input, expected }) => {
      model.updatePreferences(changedPreferences);

      model.updatePreferences(input);

      expect(model.getPreferences()).toEqual(expected);
    }
  );

  it.each(
    (
      [
        ["viewMode", "toggleViewMode"],
        ["showViewMode", "toggleShowViewMode"],
        ["showEditLink", "toggleShowEditLink"],
        ["showHelp", "toggleShowHelp"],
        ["showSkip", "toggleShowSkip"],
        ["showSwipeButtonList", "toggleShowSwipeButtonList"],
        ["showPlaybackControls", "toggleShowPlaybackControls"],
        ["showCardDetails", "toggleShowCardDetails"],
      ] as const
    ).flatMap(([setting, action]) => [true, false].map((initial) => ({ setting, action, initial })))
  )(
    "UNIT-STORE-PREF-03 toggles $setting from $initial without changing other settings",
    ({ setting, action, initial }) => {
      model.updatePreferences({
        ...changedPreferences,
        controls: { ...changedPreferences.controls, [setting]: initial },
      });

      model[action]();

      expect(model.getPreferences()).toEqual({
        ...changedPreferences,
        controls: { ...changedPreferences.controls, [setting]: !initial },
      });
    }
  );

  it.each([true, false])("UNIT-STORE-PREF-03 sets dark mode to %s without changing other settings", (darkMode) => {
    model.updatePreferences({
      ...changedPreferences,
      appearance: { ...changedPreferences.appearance, darkMode: !darkMode },
    });

    model.setDarkMode(darkMode);

    expect(model.getPreferences()).toEqual({
      ...changedPreferences,
      appearance: { ...changedPreferences.appearance, darkMode },
    });
  });

  it.each(["system", "en", "ja"] as const)(
    "UNIT-STORE-PREF-04 restores saved %s preferences in fresh memory",
    async (language) => {
      model.updatePreferences({
        ...changedPreferences,
        language,
        study: { ...changedPreferences.study, selectedTags: ["go"] },
        controls: { ...changedPreferences.controls, viewMode: false, showEditLink: true },
      });
      model.toggleViewMode();
      model.toggleShowEditLink();
      const saved = storage.getItem("tango-config");
      expect(saved).not.toBeNull();

      const { model: restartedModel } = await loadPreferences({ "tango-config": saved ?? "" });

      expect(restartedModel.getPreferences()).toEqual({
        ...changedPreferences,
        language,
        study: { ...changedPreferences.study, selectedTags: ["go"] },
        controls: { ...changedPreferences.controls, viewMode: true, showEditLink: false },
      });
    }
  );

  it.each([
    [0, 0],
    [100, 100],
    [-1, 10],
    [101, 10],
    [1.5, 10],
  ])("UNIT-STORE-PREF-05 validates study limit %s as %s without discarding valid changes", (value, expected) => {
    model.updatePreferences(numericPreferences);

    model.updatePreferences({ language: "ja", study: { maxNumberOfCardsToLearn: value } });

    expect(model.getPreferences()).toEqual({
      ...numericPreferences,
      language: "ja",
      study: { ...numericPreferences.study, maxNumberOfCardsToLearn: expected },
    });
  });

  it.each([
    [0, 0],
    [60, 60],
    [0.5, 0.5],
    [-1, 60],
    [61, 60],
  ])("UNIT-STORE-PREF-05 validates card interval %s as %s without discarding valid changes", (value, expected) => {
    model.updatePreferences(numericPreferences);

    model.updatePreferences({ language: "ja", study: { cardInterval: value } });

    expect(model.getPreferences()).toEqual({
      ...numericPreferences,
      language: "ja",
      study: { ...numericPreferences.study, cardInterval: expected },
    });
  });

  it.each([
    [0, 0],
    [1.5, 1.5],
    [-1, 0],
  ])("UNIT-STORE-PREF-05 validates back text size %s as %s without discarding valid changes", (value, expected) => {
    model.updatePreferences(numericPreferences);

    model.updatePreferences({ language: "ja", appearance: { sizeBackText: value } });

    expect(model.getPreferences()).toEqual({
      ...numericPreferences,
      language: "ja",
      appearance: { ...numericPreferences.appearance, sizeBackText: expected },
    });
  });

  it.each([
    {
      name: "missing additive fields",
      persisted: {
        ...changedPreferences,
        language: undefined,
        controls: {
          ...changedPreferences.controls,
          viewMode: undefined,
          showHelp: undefined,
          showEditLink: undefined,
          showBackTextSwipeOverlays: undefined,
          showSkip: undefined,
        },
      },
      expected: {
        ...changedPreferences,
        language: "system",
        controls: {
          ...changedPreferences.controls,
          viewMode: false,
          showHelp: true,
          showEditLink: true,
          showBackTextSwipeOverlays: false,
          showSkip: true,
        },
      },
    },
    {
      name: "invalid study limit",
      persisted: {
        ...changedPreferences,
        study: { ...changedPreferences.study, maxNumberOfCardsToLearn: 101 },
      },
      expected: {
        ...changedPreferences,
        study: { ...changedPreferences.study, maxNumberOfCardsToLearn: 10 },
      },
    },
    {
      name: "unsupported language",
      persisted: { ...changedPreferences, language: "unsupported" },
      expected: { ...changedPreferences, language: "system" },
    },
    {
      name: "empty language",
      persisted: { ...changedPreferences, language: "" },
      expected: { ...changedPreferences, language: "system" },
    },
    {
      name: "missing appearance group",
      persisted: { ...changedPreferences, appearance: undefined },
      expected: { ...changedPreferences, appearance: defaultPreferences.appearance },
    },
  ])("UNIT-STORE-PREF-06 repairs $name without losing valid saved settings", async ({ persisted, expected }) => {
    const { model: restartedModel } = await loadPreferences({
      "tango-config": JSON.stringify({ state: { preferences: persisted }, version: 1 }),
    });

    expect(restartedModel.getPreferences()).toEqual(expected);
  });

  it.each([
    { up: "GoToNextCardMastered", expectedUp: "RateEasy", expectedRight: "RateGood" },
    { up: "GoBack", expectedUp: "GoBack", expectedRight: "GoToNextCard" },
    { up: "RateHard", expectedUp: "RateHard", expectedRight: "GoToNextCard" },
  ])(
    "UNIT-STORE-PREF-07 restores version-1 swipe mapping with up=$up while preserving other preferences",
    async ({ up, expectedUp, expectedRight }) => {
      const persisted = {
        ...changedPreferences,
        language: "ja",
        controls: {
          ...changedPreferences.controls,
          cardSwipeUp: up,
          cardSwipeDown: "GoToNextCardNotMastered",
          cardSwipeLeft: "GoToPrevCard",
          cardSwipeRight: "GoToNextCard",
        },
      };
      const { model: restartedModel } = await loadPreferences({
        "tango-config": JSON.stringify({ state: { preferences: persisted }, version: 1 }),
      });

      expect(restartedModel.getPreferences()).toEqual({
        ...persisted,
        controls: {
          ...persisted.controls,
          cardSwipeUp: expectedUp,
          cardSwipeDown: "RateHard",
          cardSwipeLeft: "RateAgain",
          cardSwipeRight: expectedRight,
        },
      });
    }
  );

  it("UNIT-STORE-PREF-07 preserves valid custom swipe grades and other saved preferences", async () => {
    const persisted: Preferences = {
      ...changedPreferences,
      language: "ja",
      controls: {
        ...changedPreferences.controls,
        cardSwipeUp: "RateGood",
        cardSwipeDown: "RateAgain",
        cardSwipeLeft: "RateEasy",
        cardSwipeRight: "RateHard",
      },
    };

    const { model: restartedModel } = await loadPreferences({
      "tango-config": JSON.stringify({ state: { preferences: persisted }, version: 1 }),
    });

    expect(restartedModel.getPreferences()).toEqual(persisted);
  });

  it.each([
    ["unsupported version", JSON.stringify({ state: { preferences: changedPreferences }, version: 2 })],
    ["malformed JSON", "not-json"],
    ["schema mismatch", JSON.stringify({ state: { preferences: "invalid" }, version: 1 })],
    ["incompatible envelope", JSON.stringify({ state: { config: { darkMode: true } }, version: 1 })],
  ])("UNIT-STORE-PREF-08 starts with standard settings for %s", async (_case, persistedValue) => {
    // Zustand reports rejected versions; recovery is verified through the public preferences query.
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { model: restartedModel } = await loadPreferences({ "tango-config": persistedValue });

    expect(restartedModel.getPreferences()).toEqual(defaultPreferences);
  });

  it.each(["adding", "removing"])("UNIT-STORE-PREF-09 isolates selected tags from %s input tags", (change) => {
    const selectedTags = ["go", "typescript"];
    model.updatePreferences({ study: { selectedTags } });

    if (change === "adding") selectedTags.push("rust");
    else selectedTags.shift();

    expect(model.getPreferences().study.selectedTags).toEqual(["go", "typescript"]);
  });
});
