import { describe, expect, it } from "vitest";

import { createDeckDomain } from "../model/domain";
import { toDeckDocument, toDeckDomainFromDocument, toRemoteDeckStore } from "../model/dto";
import { parseDeckDocument } from "./document";

describe("Deck Firestore document mapping", () => {
  it("accepts legacy strings without applying current command validation", () => {
    expect(
      parseDeckDocument("deck", {
        uid: "",
        name: "",
        url: "legacy-value",
        isPublic: false,
        scoreMax: null,
        scoreMin: null,
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
      scoreMax: null,
      scoreMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });
  });

  it("maps canonical account-owned domain state to the Firestore boundary", () => {
    const domain = createDeckDomain(
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

    expect(toDeckDocument(domain)).toEqual({
      id: "deck",
      uid: "owner",
      name: "Deck",
      isPublic: false,
      scoreMax: null,
      scoreMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 10,
      updatedAt: 10,
    });
  });

  it("maps a Firestore document through domain state to the remote store boundary", () => {
    const document = parseDeckDocument("deck", {
      id: "legacy-duplicate-id",
      uid: "owner",
      name: "Deck",
      isPublic: false,
      scoreMax: null,
      scoreMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });
    const domain = toDeckDomainFromDocument("deck", document);

    expect(domain.ownerId).toBe("owner");
    expect(toRemoteDeckStore(domain)).toEqual({
      id: "deck",
      uid: "owner",
      localMode: false,
      name: "Deck",
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
  });
});
