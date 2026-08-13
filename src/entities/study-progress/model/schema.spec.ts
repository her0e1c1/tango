import { describe, expect, it } from "vitest";

import { editStudyProgressSchema } from "./schema";

describe("StudyProgress operation schemas", () => {
  it("accepts progress fields for an identified Card", () => {
    expect(
      editStudyProgressSchema.parse({
        uid: "uid-a",
        progress: { cardId: "card", score: 2, frontText: "unexpected", deckId: "other-deck" },
      })
    ).toEqual({ uid: "uid-a", progress: { cardId: "card", score: 2 } });
  });

  it("rejects missing user and Card identities", () => {
    expect(() => editStudyProgressSchema.parse({ uid: "", progress: { cardId: "card" } })).toThrow("confirmed user");
    expect(() => editStudyProgressSchema.parse({ uid: "uid-a", progress: { cardId: "" } })).toThrow("Card id");
  });
});
