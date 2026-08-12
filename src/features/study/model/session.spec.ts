import type { Card } from "@/entities/card";
import type { StudyPreferences } from "@/shared/config";

import { describe, expect, it } from "vitest";

import { buildStudySession, calculateNextIndex } from "@/features/study/model/session";

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

describe("buildStudySession", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }] as Card[];

  it("returns all card IDs in order when not shuffled and no max", () => {
    const study = { shuffled: false, maxNumberOfCardsToLearn: 0 } as StudyPreferences;
    expect(buildStudySession(cards, study)).toEqual(["a", "b", "c", "d"]);
  });

  it("respects maxNumberOfCardsToLearn", () => {
    const study = { shuffled: false, maxNumberOfCardsToLearn: 2 } as StudyPreferences;
    expect(buildStudySession(cards, study)).toEqual(["a", "b"]);
  });

  it("returns shuffled IDs when shuffled is true", () => {
    const study = { shuffled: true, maxNumberOfCardsToLearn: 0 } as StudyPreferences;
    const result = buildStudySession(cards, study);
    expect(result).toHaveLength(4);
    expect(result.sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("applies max limit after shuffle", () => {
    const study = { shuffled: true, maxNumberOfCardsToLearn: 2 } as StudyPreferences;
    const result = buildStudySession(cards, study);
    expect(result).toHaveLength(2);
  });
});
