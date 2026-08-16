import { describe, expect, it } from "vitest";

import { combineCardRead, mapCardDocument } from "./dto";

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

  it("combines a separated read for consumers awaiting migration", () => {
    expect(
      combineCardRead({
        card: {
          id: "card-a",
          frontText: "Front",
          backText: "Back",
          tags: [],
          uniqueKey: "key-card-a",
          deckId: "deck-a",
          uid: "uid-a",
          createdAt: 1,
          updatedAt: 2,
          deletedAt: null,
        },
        progress: {
          cardId: "card-a",
          score: 3,
          numberOfSeen: 4,
          nextSeeingAt: new Date(5),
        },
      })
    ).toEqual({
      id: "card-a",
      frontText: "Front",
      backText: "Back",
      tags: [],
      uniqueKey: "key-card-a",
      deckId: "deck-a",
      uid: "uid-a",
      createdAt: 1,
      updatedAt: 2,
      deletedAt: null,
      score: 3,
      numberOfSeen: 4,
      nextSeeingAt: new Date(5),
    });
  });
});
