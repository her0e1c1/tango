import { describe, expect, it } from "vitest";

import { createPreferences } from "@/test/factories";

import { buildCardPlayerHelpRows } from "./buildCardPlayerHelpRows";

describe("STUDY-CONTROLS-04 STUDY-CONTROLS-06 buildCardPlayerHelpRows", () => {
  it("explains scrolling, mode exit, and button playback while reading", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `buildCardPlayerHelpRows` with the prepared inputs.
    const rows = buildCardPlayerHelpRows(createPreferences({ controls: { viewMode: true } }));
    // Then: Verify the expected result in the assertions below.
    expect(rows.slice(0, 4).every((row) => row.action === "viewModeScroll")).toBe(true);
    expect(rows).toContainEqual({ control: "flip", action: "exitViewMode" });
    expect(rows).toContainEqual({ control: "autoPlay", action: "viewModeAutoPlay" });
    expect(rows).toContainEqual({ control: "viewMode", action: "exitViewMode" });
  });

  it("maps configured directions to semantic control and action identifiers", () => {
    // Given: Prepare `preferences` and any shared test state below.
    const preferences = createPreferences({
      controls: {
        cardSwipeUp: "GoBack",
        cardSwipeDown: "DoNothing",
        cardSwipeLeft: "RateHard",
        cardSwipeRight: "RateEasy",
      },
    });

    // When: Exercise `buildCardPlayerHelpRows` with the prepared inputs.
    const rows = buildCardPlayerHelpRows(preferences);

    // Then: Verify the expected result in the assertions below.
    expect(rows.slice(0, 4)).toEqual([
      { control: "cardSwipeUp", action: "GoBack" },
      { control: "cardSwipeDown", action: "DoNothing" },
      { control: "cardSwipeLeft", action: "RateHard" },
      { control: "cardSwipeRight", action: "RateEasy" },
    ]);
  });

  it("describes hidden and unavailable controls from current preferences", () => {
    // Given: Prepare `preferences` and any shared test state below.
    const preferences = createPreferences({
      cardInterval: 0,
      controls: { showViewMode: false, showSwipeButtonList: false, showPlaybackControls: false, showSkip: false },
    });

    // When: Exercise `buildCardPlayerHelpRows` with the prepared inputs.
    const rows = buildCardPlayerHelpRows(preferences);

    // Then: Verify the expected result in the assertions below.
    expect(rows).toEqual(
      expect.arrayContaining([
        { control: "viewMode", action: "viewModeHidden" },
        { control: "autoPlay", action: "autoPlayUnavailable" },
        { control: "swipeButtons", action: "swipeButtonsHidden" },
        { control: "playbackControls", action: "playbackControlsUnavailable" },
        { control: "skipControls", action: "skipControlsHidden" },
      ])
    );
  });

  it("omits skip help when the player does not provide a skip control", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `buildCardPlayerHelpRows` with the prepared inputs.
    const rows = buildCardPlayerHelpRows(createPreferences(), {}, false);

    // Then: Verify the expected result in the assertions below.
    expect(rows).not.toEqual(expect.arrayContaining([{ control: "skipControls", action: expect.any(String) }]));
  });

  it("keeps mapping identity independent from presentation locale", () => {
    // Given: Prepare `preferences` and any shared test state below.
    const preferences = createPreferences({ controls: { cardSwipeRight: "RateGood" } });

    // When: Exercise `buildCardPlayerHelpRows` with the prepared inputs.
    const rows = buildCardPlayerHelpRows(preferences);

    // Then: Verify the expected result in the assertions below.
    expect(rows).toContainEqual({ control: "cardSwipeRight", action: "RateGood" });
  });
});
