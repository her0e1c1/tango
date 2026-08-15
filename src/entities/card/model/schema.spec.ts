import { describe, expect, it } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

import { createCardSchema, deleteCardSchema, editCardSchema } from "./schema";

describe("Card operation schemas", () => {
  const card = createCardFixture({ id: "card", deckId: "deck", uid: "uid-a" });

  it("applies entity defaults without adding persistence timestamps", () => {
    expect(
      createCardSchema.parse({
        uid: "uid-a",
        card: {
          id: "card",
          deckId: "deck",
          uid: "uid-a",
          frontText: "front",
          backText: "back",
          tags: ["tag"],
          uniqueKey: "key",
        },
      })
    ).toEqual({
      uid: "uid-a",
      card: {
        id: "card",
        deckId: "deck",
        uid: "uid-a",
        frontText: "front",
        backText: "back",
        tags: ["tag"],
        uniqueKey: "key",
        deletedAt: null,
      },
    });
  });

  it("validates create ownership", () => {
    expect(() => createCardSchema.parse({ uid: "uid-b", card })).toThrow("owner does not match");
  });

  it("keeps ordinary edits within Card-owned editable fields", () => {
    expect(
      editCardSchema.parse({
        uid: "uid-a",
        card: { ...card, frontText: "Updated", deckId: "other", score: 99, numberOfSeen: 99 },
      })
    ).toEqual({
      uid: "uid-a",
      card: {
        id: card.id,
        uid: card.uid,
        frontText: "Updated",
        backText: card.backText,
        tags: card.tags,
        uniqueKey: card.uniqueKey,
      },
    });
    expect(() => editCardSchema.parse({ uid: "uid-b", card })).toThrow("owner does not match");
  });

  it("validates delete ownership and returns only Card identity", () => {
    expect(deleteCardSchema.parse({ uid: "uid-a", card })).toEqual({
      uid: "uid-a",
      card: { id: "card", uid: "uid-a" },
    });
    expect(() => deleteCardSchema.parse({ uid: "uid-b", card })).toThrow("owner does not match");
  });
});
