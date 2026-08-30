import { describe, expect, it } from "vitest";

import { createPreferences } from "@/test/factories";

import { buildStudyHelpContent } from "./studyHelp";

describe("buildStudyHelpContent", () => {
  it("maps configured directions to semantic user-facing actions", () => {
    const preferences = createPreferences({
      controls: {
        cardSwipeUp: "GoBack",
        cardSwipeDown: "DoNothing",
        cardSwipeLeft: "GoToNextCardToggleMastered",
        cardSwipeRight: "GoToPrevCard",
      },
    });

    const content = buildStudyHelpContent(preferences, "en-US");

    expect(content.rows.slice(0, 4)).toEqual([
      { control: "Arrow Up / Swipe Up", action: "End the current session and return to the deck list" },
      { control: "Arrow Down / Swipe Down", action: "No action" },
      { control: "Arrow Left / Swipe Left", action: "Toggle mastered and go to the next card" },
      { control: "Arrow Right / Swipe Right", action: "Go to the previous card" },
    ]);
    expect(content.rows.map((row) => row.action).join(" ")).not.toContain("GoTo");
  });

  it("describes hidden and unavailable controls from current preferences", () => {
    const preferences = createPreferences({
      cardInterval: 0,
      controls: { showSwipeButtonList: false, showPlaybackControls: false },
    });

    const content = buildStudyHelpContent(preferences, "en");

    expect(content.rows).toEqual(
      expect.arrayContaining([
        { control: "Space / Play or Pause button", action: "Autoplay is unavailable while the card interval is 0" },
        { control: "B / Swipe controls button", action: "Show the currently hidden swipe buttons" },
        {
          control: "Playback controls button",
          action: "Playback controls are unavailable while the card interval is 0",
        },
      ])
    );
  });

  it("uses Japanese semantic resources without changing mapping identity", () => {
    const preferences = createPreferences({ controls: { cardSwipeRight: "GoToNextCardMastered" } });

    const content = buildStudyHelpContent(preferences, "ja-JP");

    expect(content.title).toBe("学習画面の操作");
    expect(content.rows).toContainEqual({
      control: "右矢印 / 右へスワイプ",
      action: "習得済みにして次のカードへ移動",
    });
  });
});
