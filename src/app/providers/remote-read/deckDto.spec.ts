import { describe, expect, it } from "vitest";

import { convertDeckDtoToDeck } from "./deckDto";

const deckDto = (overrides: Record<string, unknown> = {}) => ({
  name: "Remote Deck",
  isPublic: true,
  uid: "user-2",
  createdAt: 10,
  updatedAt: 20,
  deletedAt: null,
  scoreMax: 5,
  scoreMin: -3,
  selectedTags: ["science"],
  tagAndFilter: true,
  category: "remote",
  convertToBr: true,
  ...overrides,
});

describe("Deck DTO", () => {
  it("converts Deck-owned fields and optional url using the snapshot id", () => {
    expect(
      convertDeckDtoToDeck(
        "snapshot-id",
        deckDto({
          id: "payload-id",
          url: "https://example.com/deck",
          currentIndex: 2,
          cardOrderIds: ["card-2"],
        })
      )
    ).toEqual({
      id: "snapshot-id",
      name: "Remote Deck",
      url: "https://example.com/deck",
      isPublic: true,
      uid: "user-2",
      createdAt: 10,
      updatedAt: 20,
      deletedAt: null,
      scoreMax: 5,
      scoreMin: -3,
      selectedTags: ["science"],
      tagAndFilter: true,
      category: "remote",
      convertToBr: true,
    });
  });

  it("omits an absent optional url", () => {
    expect(convertDeckDtoToDeck("snapshot-id", deckDto())).not.toHaveProperty("url");
  });

  it("reports invalid documents through the Firestore validation boundary", () => {
    expect(() => convertDeckDtoToDeck("invalid-deck", deckDto({ selectedTags: [42] }))).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "deck",
        documentId: "invalid-deck",
        message: expect.stringContaining("selectedTags.0"),
      })
    );
    expect(() => convertDeckDtoToDeck("missing-deck", { uid: "user-2" })).toThrowError(
      expect.objectContaining({ name: "FirestoreDocumentValidationError" })
    );
  });
});
