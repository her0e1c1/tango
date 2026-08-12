import type { Deck, DeckEdit } from "../model/deck";

import { describe, expect, it } from "vitest";

import { FirestoreDocumentValidationError } from "@/shared/firestore";
import { createDeck } from "@/test/factories";
import { buildDeckCreateDto, buildDeckUpdateDto, mapDeckDocument } from "./firestoreDocument";

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
    expect(() => mapDeckDocument("missing-deck", { uid: "user-2" })).toThrow(FirestoreDocumentValidationError);
  });

  it("builds filtered create and update DTOs from Deck-owned fields", () => {
    const deck = {
      ...createDeck({
        id: "deck-1",
        uid: "user-1",
        createdAt: 1,
        updatedAt: 2,
        selectedTags: ["math"],
      }),
      currentIndex: 3,
      cardOrderIds: ["card-1"],
    } satisfies Deck & { currentIndex: number; cardOrderIds: string[] };

    expect(buildDeckCreateDto(deck, 100)).toEqual({
      id: "deck-1",
      name: "Deck",
      isPublic: false,
      uid: "user-1",
      createdAt: 100,
      updatedAt: 100,
      deletedAt: null,
      scoreMax: null,
      scoreMin: null,
      selectedTags: ["math"],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
    });
    const deckUpdate = {
      id: deck.id,
      name: "Updated",
      currentIndex: 4,
    } satisfies DeckEdit & { currentIndex: number };
    expect(buildDeckUpdateDto(deckUpdate, 101)).toEqual({
      name: "Updated",
      updatedAt: 101,
    });
  });

  it("validates DTO field values", () => {
    const invalidDeck = { ...createDeck(), selectedTags: ["math", 42] } as unknown as Deck;

    expect(() => buildDeckCreateDto(invalidDeck, 100)).toThrow();
  });
});
