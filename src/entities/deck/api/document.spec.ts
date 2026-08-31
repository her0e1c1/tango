import { describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { parseDeckDocument, toDeck, toDeckDocument } from "./document";

describe("Deck Firestore document mapping [CARD-10]", () => {
  it("accepts legacy strings without applying current command validation", () => {
    expect(
      parseDeckDocument("deck", {
        uid: "",
        name: "",
        url: "legacy-value",
        isPublic: false,
        difficultyMax: null,
        difficultyMin: null,
        selectedTags: [],
        tagAndFilter: false,
        category: "",
        convertToBr: false,
        deletedAt: null,
        createdAt: 1,
        updatedAt: 2,
      })
    ).toEqual({
      uid: "",
      name: "",
      url: "legacy-value",
      isPublic: false,
      difficultyMax: null,
      difficultyMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });
  });

  it("maps a remote create command to the Firestore boundary", () => {
    const { uid: _uid, createdAt: _createdAt, updatedAt: _updatedAt, ...deck } = createDeck({ id: "deck" });

    expect(toDeckDocument("actor", deck, 10)).toEqual({
      id: "deck",
      uid: "actor",
      name: "Deck",
      isPublic: false,
      difficultyMax: null,
      difficultyMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 10,
      updatedAt: 10,
    });
  });

  it("maps a Firestore document to the remote store boundary", () => {
    const document = parseDeckDocument("deck", {
      id: "legacy-duplicate-id",
      uid: "owner",
      name: "Deck",
      isPublic: false,
      difficultyMax: null,
      difficultyMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });

    expect(toDeck("deck", document)).toEqual({
      id: "deck",
      uid: "owner",
      localMode: false,
      name: "Deck",
      isPublic: false,
      difficultyMax: null,
      difficultyMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      createdAt: 1,
      updatedAt: 2,
    });
  });

  it("adapts legacy score bounds while reversing their direction", () => {
    const document = parseDeckDocument("deck", {
      uid: "owner",
      name: "Legacy filters",
      isPublic: false,
      scoreMax: 4,
      scoreMin: 1,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });

    expect(toDeck("deck", document)).toEqual(expect.objectContaining({ difficultyMin: 1, difficultyMax: 4 }));
  });

  it("uses difficulty bounds when legacy score bounds are also present", () => {
    const document = parseDeckDocument("deck", {
      uid: "owner",
      name: "Current filters",
      isPublic: false,
      difficultyMax: 8,
      difficultyMin: 3,
      scoreMax: 4,
      scoreMin: 1,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });

    expect(toDeck("deck", document)).toEqual(expect.objectContaining({ difficultyMin: 3, difficultyMax: 8 }));
  });

  it("maps independently migrated difficulty bounds without losing the remaining legacy bound", () => {
    const document = parseDeckDocument("deck", {
      uid: "owner",
      name: "Partially migrated filters",
      isPublic: false,
      difficultyMax: 8,
      scoreMax: 4,
      scoreMin: 1,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });

    expect(toDeck("deck", document)).toEqual(expect.objectContaining({ difficultyMin: 1, difficultyMax: 8 }));
  });

  it("rejects malformed difficulty bounds instead of falling back to score bounds", () => {
    expect(() =>
      parseDeckDocument("deck", {
        uid: "owner",
        name: "Malformed filters",
        isPublic: false,
        difficultyMax: 11,
        difficultyMin: 3,
        scoreMax: 4,
        scoreMin: 1,
        selectedTags: [],
        tagAndFilter: false,
        category: "",
        convertToBr: false,
        deletedAt: null,
        createdAt: 1,
        updatedAt: 2,
      })
    ).toThrow();
  });
});
