import { describe, expect, it } from "vitest";

import { createPreferences } from "@/test/factories";

import { buildStudyHelpRows } from "./studyHelp";

describe("SWIPE-24 buildStudyHelpRows", () => {
  it("maps configured directions to semantic control and action identifiers", () => {
    const preferences = createPreferences({
      controls: {
        cardSwipeUp: "GoBack",
        cardSwipeDown: "DoNothing",
        cardSwipeLeft: "GoToNextCardToggleMastered",
        cardSwipeRight: "GoToPrevCard",
      },
    });

    const rows = buildStudyHelpRows(preferences);

    expect(rows.slice(0, 4)).toEqual([
      { control: "cardSwipeUp", action: "GoBack" },
      { control: "cardSwipeDown", action: "DoNothing" },
      { control: "cardSwipeLeft", action: "GoToNextCardToggleMastered" },
      { control: "cardSwipeRight", action: "GoToPrevCard" },
    ]);
  });

  it("describes hidden and unavailable controls from current preferences", () => {
    const preferences = createPreferences({
      cardInterval: 0,
      controls: { showSwipeButtonList: false, showPlaybackControls: false },
    });

    const rows = buildStudyHelpRows(preferences);

    expect(rows).toEqual(
      expect.arrayContaining([
        { control: "autoPlay", action: "autoPlayUnavailable" },
        { control: "swipeButtons", action: "swipeButtonsHidden" },
        { control: "playbackControls", action: "playbackControlsUnavailable" },
      ])
    );
  });

  it("keeps mapping identity independent from presentation locale", () => {
    const preferences = createPreferences({ controls: { cardSwipeRight: "GoToNextCardMastered" } });

    const rows = buildStudyHelpRows(preferences);

    expect(rows).toContainEqual({ control: "cardSwipeRight", action: "GoToNextCardMastered" });
  });
});
