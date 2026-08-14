import { describe, expect, it } from "vitest";

import { editStudyProgressSchema } from "./schema";

describe("StudyProgress operation schemas", () => {
  it("accepts edits owned by the authenticated user", () => {
    expect(
      editStudyProgressSchema.parse({
        uid: "uid-a",
        progress: { uid: "uid-a", cardId: "card", score: 2, frontText: "unexpected", deckId: "other-deck" },
      })
    ).toEqual({ uid: "uid-a", progress: { uid: "uid-a", cardId: "card", score: 2 } });
  });

  it("rejects edits owned by another user", () => {
    expect(() => editStudyProgressSchema.parse({ uid: "uid-a", progress: { uid: "uid-b", cardId: "card" } })).toThrow(
      "owner does not match"
    );
  });

  it("rejects missing user, owner, and Card identities", () => {
    expect(() => editStudyProgressSchema.parse({ uid: "", progress: { uid: "uid-a", cardId: "card" } })).toThrow(
      "confirmed user"
    );
    expect(() => editStudyProgressSchema.parse({ uid: "uid-a", progress: { uid: "", cardId: "card" } })).toThrow(
      "StudyProgress owner"
    );
    expect(() => editStudyProgressSchema.parse({ uid: "uid-a", progress: { uid: "uid-a", cardId: "" } })).toThrow(
      "Card id"
    );
  });
});
