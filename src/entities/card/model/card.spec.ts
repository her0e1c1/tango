import { describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { createCard } from "./card";

describe("createCard", () => {
  it("creates a card with entity defaults and an injected id", () => {
    expect(
      createCard(
        { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key" },
        createDeck({ id: "deck-id", uid: "uid-a" }),
        () => "card-id"
      )
    ).toEqual({
      frontText: "front",
      backText: "back",
      tags: ["tag"],
      uniqueKey: "key",
      id: "card-id",
      deckId: "deck-id",
      uid: "uid-a",
      score: 0,
      numberOfSeen: 0,
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
    });
  });
});
