import { describe, expect, it } from "vitest";

import { editStudyProgressSchema } from "./schema";

describe("StudyProgress operation schemas [SWIPE-02]", () => {
  it("accepts progress fields for an identified Card", () => {
    expect(
      editStudyProgressSchema.parse({
        uid: "uid-a",
        progress: { cardId: "card", difficulty: 2, frontText: "unexpected", deckId: "other-deck" },
      })
    ).toEqual({ uid: "uid-a", progress: { cardId: "card", difficulty: 2 } });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0, 10.01])("rejects invalid difficulty %s", (difficulty) => {
    expect(() => editStudyProgressSchema.parse({ uid: "uid-a", progress: { cardId: "card", difficulty } })).toThrow();
  });

  it("accepts fractional difficulty inside the range", () => {
    expect(editStudyProgressSchema.parse({ uid: "uid-a", progress: { cardId: "card", difficulty: 5.5 } })).toEqual({
      uid: "uid-a",
      progress: { cardId: "card", difficulty: 5.5 },
    });
  });

  it("rejects missing user and Card identities", () => {
    expect(() => editStudyProgressSchema.parse({ uid: "", progress: { cardId: "card" } })).toThrow("confirmed user");
    expect(() => editStudyProgressSchema.parse({ uid: "uid-a", progress: { cardId: "" } })).toThrow("Card id");
  });
});
