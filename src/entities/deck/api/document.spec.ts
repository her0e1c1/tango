import { describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { parseDeckDocument, toDeck, toDeckDocument } from "./document";

describe("Deck Firestore document mapping [CARD-10]", () => {
  it("ignores legacy visibility while accepting persisted strings", () => {
    expect(
      parseDeckDocument("deck", {
        uid: "",
        name: "",
        url: "legacy-value",
        isPublic: true,
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
      isPublic: true,
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

  it("rejects malformed difficulty bounds", () => {
    expect(() =>
      parseDeckDocument("deck", {
        uid: "owner",
        name: "Malformed filters",
        difficultyMax: 11,
        difficultyMin: 3,
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
