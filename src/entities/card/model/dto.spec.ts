import { describe, expect, it } from "vitest";

import { mapCardDocument } from "./dto";

describe("Card document mapping", () => {
  it("maps only Card fields from a physical Card document", () => {
    const document = {
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
      url: "https://example.com/card-a",
      startLine: 7,
      endLine: 8,
    };

    expect(mapCardDocument("card-a", document)).toEqual({
      id: "card-a",
      frontText: "Front",
      backText: "Back",
      tags: ["science"],
      uniqueKey: "key-card-a",
      deckId: "deck-a",
      uid: "uid-a",
      createdAt: 1,
      updatedAt: 2,
      deletedAt: null,
      url: "https://example.com/card-a",
      startLine: 7,
      endLine: 8,
    });
  });
});
