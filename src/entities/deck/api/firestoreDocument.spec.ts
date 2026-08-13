import { describe, expect, it } from "vitest";

import { mapDeckDocument } from "./firestoreDocument";

const deckDocument = (overrides: Record<string, unknown> = {}) => ({
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

describe("Deck Firestore document", () => {
  it("maps Deck-owned fields and optional url using the snapshot id", () => {
    expect(
      mapDeckDocument(
        "snapshot-id",
        deckDocument({
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
    expect(mapDeckDocument("snapshot-id", deckDocument())).not.toHaveProperty("url");
  });

  it("reports invalid documents through the Firestore validation boundary", () => {
    expect(() => mapDeckDocument("invalid-deck", deckDocument({ selectedTags: [42] }))).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "deck",
        documentId: "invalid-deck",
        message: expect.stringContaining("selectedTags.0"),
      })
    );
    expect(() => mapDeckDocument("missing-deck", { uid: "user-2" })).toThrowError(
      expect.objectContaining({ name: "FirestoreDocumentValidationError" })
    );
  });
});
