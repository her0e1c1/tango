import { describe, expect, it } from "vitest";

import { createPreferences } from "@/test/factories";

import { buildCardPlayerHelpRows } from "./buildCardPlayerHelpRows";

describe("STUDY-CONTROLS-04 STUDY-CONTROLS-06 buildCardPlayerHelpRows", () => {
  it("explains scrolling, mode exit, and button playback while reading", () => {
    const rows = buildCardPlayerHelpRows(createPreferences({ controls: { viewMode: true } }));
    expect(rows.slice(0, 4).every((row) => row.action === "viewModeScroll")).toBe(true);
    expect(rows).toContainEqual({ control: "flip", action: "exitViewMode" });
    expect(rows).toContainEqual({ control: "autoPlay", action: "viewModeAutoPlay" });
    expect(rows).toContainEqual({ control: "viewMode", action: "exitViewMode" });
  });

  it("maps configured directions to semantic control and action identifiers", () => {
    const preferences = createPreferences({
      controls: {
        cardSwipeUp: "GoBack",
        cardSwipeDown: "DoNothing",
        cardSwipeLeft: "RateHard",
        cardSwipeRight: "RateEasy",
      },
    });

    const rows = buildCardPlayerHelpRows(preferences);

    expect(rows.slice(0, 4)).toEqual([
      { control: "cardSwipeUp", action: "GoBack" },
      { control: "cardSwipeDown", action: "DoNothing" },
      { control: "cardSwipeLeft", action: "RateHard" },
      { control: "cardSwipeRight", action: "RateEasy" },
    ]);
  });

  it("describes hidden and unavailable controls from current preferences", () => {
    const preferences = createPreferences({
      cardInterval: 0,
      controls: { showSwipeButtonList: false, showPlaybackControls: false, showSkip: false },
    });

    const rows = buildCardPlayerHelpRows(preferences);

    expect(rows).toEqual(
      expect.arrayContaining([
        { control: "autoPlay", action: "autoPlayUnavailable" },
        { control: "swipeButtons", action: "swipeButtonsHidden" },
        { control: "playbackControls", action: "playbackControlsUnavailable" },
        { control: "skipControls", action: "skipControlsHidden" },
      ])
    );
  });

  it("omits skip help when the player does not provide a skip control", () => {
    const rows = buildCardPlayerHelpRows(createPreferences(), {}, false);

    expect(rows).not.toEqual(expect.arrayContaining([{ control: "skipControls", action: expect.any(String) }]));
  });

  it("keeps mapping identity independent from presentation locale", () => {
    const preferences = createPreferences({ controls: { cardSwipeRight: "RateGood" } });

    const rows = buildCardPlayerHelpRows(preferences);

    expect(rows).toContainEqual({ control: "cardSwipeRight", action: "RateGood" });
  });
});
