import { describe, expect, it } from "vitest";

import { mapStudyProgressDocument } from "./document";

describe("StudyProgress document", () => {
  it("maps progress without Card content", () => {
    const progress = mapStudyProgressDocument("card-a", {
      frontText: "Front",
      backText: "Back",
      tags: ["science"],
      uniqueKey: "key-card-a",
      deckId: "deck-a",
      uid: "uid-a",
      createdAt: 1,
      updatedAt: 2,
      deletedAt: null,
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
    });

    expect(progress).toEqual({
      cardId: "card-a",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
    });
    expect(progress).not.toHaveProperty("frontText");
    expect(progress).not.toHaveProperty("deckId");
  });
});
