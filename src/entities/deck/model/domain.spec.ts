import { describe, expect, it } from "vitest";

import { createDeckDomain, editDeckDomain, isDeckOwnedBy, restoreDeckDomain } from "./domain";

describe("Deck domain", () => {
  it("creates an account-owned Deck with normalized optional data", () => {
    const deck = createDeckDomain(
      {
        ownerId: "owner",
        id: "deck",
        name: "Deck",
        isPublic: false,
        scoreMax: null,
        scoreMin: null,
        selectedTags: [],
        tagAndFilter: false,
        category: "",
        convertToBr: false,
      },
      10
    );

    expect(deck).toEqual({
      id: "deck",
      ownerId: "owner",
      name: "Deck",
      url: null,
      isPublic: false,
      scoreMax: null,
      scoreMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      createdAt: 10,
      updatedAt: 10,
    });
    expect(isDeckOwnedBy(deck, "owner")).toBe(true);
  });

  it("restores a local Deck without inventing an account owner", () => {
    const deck = restoreDeckDomain({
      id: "local",
      ownerId: null,
      name: "Local",
      isPublic: false,
      scoreMax: null,
      scoreMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      createdAt: 1,
      updatedAt: 2,
    });

    expect(deck.ownerId).toBeNull();
    expect(isDeckOwnedBy(deck, "owner")).toBe(false);
  });

  it("edits domain state without changing identity, ownership, or creation time", () => {
    const current = restoreDeckDomain({
      id: "deck",
      ownerId: "owner",
      name: "Before",
      url: "https://example.com",
      isPublic: false,
      scoreMax: null,
      scoreMin: null,
      selectedTags: ["before"],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      createdAt: 1,
      updatedAt: 2,
    });

    expect(editDeckDomain(current, { id: "deck", name: "After", url: null, selectedTags: ["after"] }, 3)).toEqual({
      ...current,
      name: "After",
      url: null,
      selectedTags: ["after"],
      updatedAt: 3,
    });
  });
});
