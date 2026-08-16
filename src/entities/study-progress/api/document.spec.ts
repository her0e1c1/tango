import { describe, expect, it } from "vitest";

import type { CardDocument } from "@/entities/card/@x/study-progress";
import { mapStudyProgressDocument } from "./document";

describe("StudyProgress document mapping", () => {
  it("maps only StudyProgress fields from a Card document", () => {
    const document: CardDocument = {
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
    };

    expect(mapStudyProgressDocument("card-a", document)).toEqual({
      cardId: "card-a",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
    });
  });
});
