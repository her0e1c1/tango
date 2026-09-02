import { describe, expect, it } from "vitest";

import { createCard as createCardFixture } from "@/test/factories";

import { cardContentSchema, createCardSchema, deleteCardSchema, editCardSchema } from "./schema";

describe("Card content schema [CARD-01]", () => {
  it.each(["", "   ", "\n\t"])("rejects blank front text: %j", (frontText) => {
    expect(() => cardContentSchema.parse({ frontText, backText: "back", tags: [], uniqueKey: "key" })).toThrow(
      "Front text is required."
    );
  });

  it.each(["", "   ", "\n\t"])("rejects blank back text: %j", (backText) => {
    expect(() => cardContentSchema.parse({ frontText: "front", backText, tags: [], uniqueKey: "key" })).toThrow(
      "Back text is required."
    );
  });

  it.each(["", "   ", "\n\t"])("rejects blank unique keys: %j", (uniqueKey) => {
    expect(() => cardContentSchema.parse({ frontText: "front", backText: "back", tags: [], uniqueKey })).toThrow(
      "Unique key is required."
    );
  });
});

describe("Card operation schemas [CARD-01]", () => {
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
        difficulty: 5,
        numberOfSeen: 0,
      },
    });
  });

  it("validates create ownership", () => {
    expect(() => createCardSchema.parse({ uid: "uid-b", card })).toThrow("owner does not match");
  });

  it("applies Card content validation to creates and edits", () => {
    expect(() => createCardSchema.parse({ uid: "uid-a", card: { ...card, uniqueKey: " " } })).toThrow(
      "Unique key is required."
    );
    expect(() => editCardSchema.parse({ uid: "uid-a", card: { id: card.id, uid: card.uid, frontText: " " } })).toThrow(
      "Front text is required."
    );
  });

  it("keeps ordinary edits within Card-owned editable fields", () => {
    expect(
      editCardSchema.parse({
        uid: "uid-a",
        card: { ...card, frontText: "Updated", deckId: "other", difficulty: 99, numberOfSeen: 99 },
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
