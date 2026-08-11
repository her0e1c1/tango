import { describe, expect, it } from "vitest";

import { createDeck } from "./deck";

describe("createDeck", () => {
  it("creates a deck with entity defaults and an injected id", () => {
    expect(createDeck({ name: "name" }, "uid", () => "deck-id")).toEqual({
      name: "name",
      id: "deck-id",
      uid: "uid",
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
      scoreMax: null,
      scoreMin: null,
      isPublic: false,
      selectedTags: [],
      tagAndFilter: false,
      convertToBr: false,
      category: "",
    });
  });
});
