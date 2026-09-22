import { describe, expect, it } from "vitest";

import { createDeckSchema } from "../model/schema";
import { parseDeckDocument, toDeck, toDeckDocument } from "./document";

describe("Deck Firestore document mapping [CARD-LIST-ACTIONS-01]", () => {
  it("accepts legacy strings without applying current command validation", () => {
    expect(
      parseDeckDocument("deck", {
        uid: "",
        name: "",
        url: "legacy-value",
        isPublic: false,
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
    const { deck } = createDeckSchema.parse({ uid: "actor", deck: { id: "deck", name: "Deck" } });

    expect(toDeckDocument("actor", deck, 10)).toEqual({
      id: "deck",
      uid: "actor",
      name: "Deck",
      isPublic: false,
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

      name: "Deck",
      isPublic: false,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      createdAt: 1,
      updatedAt: 2,
    });
  });
});
