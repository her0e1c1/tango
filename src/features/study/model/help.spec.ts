import type { SwipeAction } from "@/entities/preferences";

import { describe, expect, it } from "vitest";

import { buildStudyHelpItems } from "./help";

describe("Study help model", () => {
  it.each<[SwipeAction, string]>([
    ["DoNothing", "No action"],
    ["GoBack", "Exit study"],
    ["GoToPrevCard", "Previous card"],
    ["GoToNextCard", "Next card"],
    ["GoToNextCardMastered", "Mark mastered and next"],
    ["GoToNextCardNotMastered", "Mark not mastered and next"],
    ["GoToNextCardToggleMastered", "Toggle mastery and next"],
  ])("maps %s to its current user-facing label", (action, label) => {
    const [item] = buildStudyHelpItems({
      cardSwipeUp: action,
      cardSwipeDown: "DoNothing",
      cardSwipeLeft: "DoNothing",
      cardSwipeRight: "DoNothing",
    });
    expect(item?.action).toBe(label);
  });

  it("builds the guide from current controls", () => {
    expect(
      buildStudyHelpItems({
        cardSwipeUp: "GoBack",
        cardSwipeDown: "DoNothing",
        cardSwipeLeft: "GoToPrevCard",
        cardSwipeRight: "GoToNextCardMastered",
      })
    ).toEqual(
      expect.arrayContaining([
        { control: "Swipe/Arrow Up", action: "Exit study" },
        { control: "Swipe/Arrow Down", action: "No action" },
        { control: "Swipe/Arrow Left", action: "Previous card" },
        { control: "Swipe/Arrow Right", action: "Mark mastered and next" },
        { control: "Enter", action: "Show/hide answer" },
      ])
    );
  });
});
