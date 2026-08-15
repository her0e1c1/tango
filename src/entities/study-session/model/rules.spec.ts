import { describe, expect, it } from "vitest";

import { calculateNextIndex } from "./rules";

describe("calculateNextIndex", () => {
  it("moves forward for non-prev actions", () => {
    expect(calculateNextIndex(0, 3, "GoToNextCard")).toBe(1);
    expect(calculateNextIndex(1, 3, "GoToNextCardMastered")).toBe(2);
  });

  it("returns -1 when advancing past the last card", () => {
    expect(calculateNextIndex(2, 3, "GoToNextCard")).toBe(-1);
  });

  it("moves backward for GoToPrevCard", () => {
    expect(calculateNextIndex(2, 3, "GoToPrevCard")).toBe(1);
  });

  it("returns -1 when moving before the first card", () => {
    expect(calculateNextIndex(0, 3, "GoToPrevCard")).toBe(-1);
  });
});
