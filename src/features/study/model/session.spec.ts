import type { Card } from "@/entities/card";
import type { StudyPreferences } from "@/entities/preferences";

import { describe, expect, it } from "vitest";

import { buildStudySession, resolveStudyTransition } from "./session";

describe("resolveStudyTransition", () => {
  it("distinguishes forward movement from completion", () => {
    expect(resolveStudyTransition(0, 3, "GoToNextCard")).toEqual({ type: "move", index: 1 });
    expect(resolveStudyTransition(2, 3, "GoToNextCardMastered")).toEqual({ type: "complete" });
  });

  it("keeps previous on the first Card as a no-op", () => {
    expect(resolveStudyTransition(0, 3, "GoToPrevCard")).toEqual({ type: "no-op" });
  });

  it("moves backward after the first Card", () => {
    expect(resolveStudyTransition(2, 3, "GoToPrevCard")).toEqual({ type: "move", index: 1 });
  });

  it("distinguishes Exit and DoNothing", () => {
    expect(resolveStudyTransition(1, 3, "GoBack")).toEqual({ type: "exit" });
    expect(resolveStudyTransition(1, 3, "DoNothing")).toEqual({ type: "no-op" });
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
