/**
 * @file Verifies the "Firestore DTO builders" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "maps only remote deck
 * fields using the snapshot id", "omits an absent optional url when mapping a remote deck", "maps
 * only remote card fields using the snapshot id".
 */

import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";

import {
  buildCardCreateDto,
  buildCardUpdateDto,
  buildDeckCreateDto,
  buildDeckUpdateDto,
  FirestoreDocumentValidationError,
  mapCardDocument,
  mapDeckDocument,
} from "@/adapters/firestore/dto";
import { createCard, createDeck } from "@/test/factories";

describe("Firestore DTO builders", () => {
  const deck = createDeck({
    id: "deck-1",
    name: "Deck",
    isPublic: true,
    uid: "user-1",
    createdAt: 1,
    updatedAt: 2,
    scoreMax: 3,
    scoreMin: -2,
    selectedTags: ["math"],
    tagAndFilter: true,
    category: "category",
    convertToBr: true,
  });

  const card = createCard({
    id: "card-1",
    deckId: deck.id,
    uid: deck.uid,
    tags: ["math"],
    createdAt: 1,
    updatedAt: 2,
    score: 3,
    numberOfSeen: 4,
    lastSeenAt: 5,
    nextSeeingAt: new Date(6),
    interval: 7,
    startLine: 8,
    endLine: 9,
  });

  const cardDocument = (overrides: Record<string, unknown> = {}) => ({
    frontText: "Remote front",
    backText: "Remote back",
    tags: ["science"],
    uniqueKey: "remote-key",
    deckId: "deck-2",
    uid: "user-2",
    createdAt: 10,
    updatedAt: 20,
    deletedAt: null,
    score: 3,
    numberOfSeen: 4,
    ...overrides,
  });

  it("maps a remote deck without a payload id using the snapshot id", () => {
    const document = {
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
      currentIndex: 2,
      cardOrderIds: ["card-2"],
    };

    expect(mapDeckDocument("snapshot-id", document)).toEqual({
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

  it("omits an absent optional url when mapping a remote deck", () => {
    const document = {
      id: "payload-id",
      name: "Remote Deck",
      isPublic: false,
      uid: "user-2",
      createdAt: 10,
      updatedAt: 20,
      deletedAt: null,
      scoreMax: null,
      scoreMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
    };

    expect(mapDeckDocument("snapshot-id", document)).not.toHaveProperty("url");
  });

  it("maps a remote card without a payload id using the snapshot id", () => {
    const document = cardDocument({
      lastSeenAt: 50,
      nextSeeingAt: Timestamp.fromMillis(60),
      interval: 7,
      url: "https://example.com/card",
      startLine: 8,
      endLine: 9,
      currentIndex: 2,
      cardOrderIds: ["card-2"],
    });

    expect(mapCardDocument("snapshot-id", document)).toEqual({
      id: "snapshot-id",
      frontText: "Remote front",
      backText: "Remote back",
      tags: ["science"],
      uniqueKey: "remote-key",
      deckId: "deck-2",
      uid: "user-2",
      createdAt: 10,
      updatedAt: 20,
      deletedAt: null,
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 50,
      nextSeeingAt: new Date(60),
      interval: 7,
      url: "https://example.com/card",
      startLine: 8,
      endLine: 9,
    });
  });

  it("omits absent optional fields when mapping a remote card", () => {
    const document = cardDocument({ tags: [], score: 0, numberOfSeen: 0 });

    const mapped = mapCardDocument("snapshot-id", document);

    expect(mapped).not.toHaveProperty("lastSeenAt");
    expect(mapped).not.toHaveProperty("nextSeeingAt");
    expect(mapped).not.toHaveProperty("interval");
    expect(mapped).not.toHaveProperty("url");
    expect(mapped).not.toHaveProperty("startLine");
    expect(mapped).not.toHaveProperty("endLine");
  });

  it("accepts a legacy Date for nextSeeingAt", () => {
    const nextSeeingAt = new Date(60);

    expect(mapCardDocument("snapshot-id", cardDocument({ nextSeeingAt }))).toEqual(
      expect.objectContaining({ nextSeeingAt })
    );
  });

  it.each([null, "2026-01-01", 60, {}])("rejects invalid nextSeeingAt value %j with its field path", (value) => {
    expect(() => mapCardDocument("invalid-card", cardDocument({ nextSeeingAt: value }))).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "card",
        documentId: "invalid-card",
        message: expect.stringContaining("nextSeeingAt"),
      })
    );
  });

  it("rejects missing required fields and field type mismatches", () => {
    const { frontText: _frontText, ...missingFrontText } = cardDocument();

    expect(() => mapCardDocument("missing-field", missingFrontText)).toThrow(FirestoreDocumentValidationError);
    expect(() => mapDeckDocument("wrong-type", { name: 42 })).toThrowError(
      expect.objectContaining({
        message: expect.stringContaining("name"),
      })
    );
  });

  it("allows only server deck fields when creating", () => {
    expect(buildDeckCreateDto(deck, 100)).toEqual({
      id: "deck-1",
      name: "Deck",
      isPublic: true,
      uid: "user-1",
      createdAt: 100,
      updatedAt: 100,
      deletedAt: null,
      scoreMax: 3,
      scoreMin: -2,
      selectedTags: ["math"],
      tagAndFilter: true,
      category: "category",
      convertToBr: true,
    });
  });

  it("omits the id, undefined values, and client state when updating a deck", () => {
    expect(buildDeckUpdateDto(deck, 101)).toEqual({
      name: "Deck",
      isPublic: true,
      uid: "user-1",
      createdAt: 1,
      updatedAt: 101,
      deletedAt: null,
      scoreMax: 3,
      scoreMin: -2,
      selectedTags: ["math"],
      tagAndFilter: true,
      category: "category",
      convertToBr: true,
    });
  });

  it("allows only server card fields when creating", () => {
    expect(buildCardCreateDto(card, 200)).toEqual({
      id: "card-1",
      deckId: "deck-1",
      uid: "user-1",
      frontText: "front",
      backText: "back",
      tags: ["math"],
      uniqueKey: "unique-key",
      createdAt: 200,
      updatedAt: 200,
      deletedAt: null,
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
      startLine: 8,
      endLine: 9,
    });
  });

  it("omits the id and undefined values when updating a card", () => {
    expect(buildCardUpdateDto(card, 201)).toEqual({
      deckId: "deck-1",
      uid: "user-1",
      frontText: "front",
      backText: "back",
      tags: ["math"],
      uniqueKey: "unique-key",
      createdAt: 1,
      updatedAt: 201,
      deletedAt: null,
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
      startLine: 8,
      endLine: 9,
    });
  });

  it("validates write DTOs with the same storage contract", () => {
    const invalidCard = { ...card, tags: ["math", 42] } as unknown as Card;
    const invalidDeck = { ...deck, selectedTags: [42] } as unknown as Deck;
    const cardWithoutId = { ...card, id: undefined } as unknown as Card;
    const deckWithoutId = { ...deck, id: undefined } as unknown as Deck;

    expect(() => buildCardCreateDto(invalidCard, 200)).toThrow();
    expect(() => buildDeckUpdateDto(invalidDeck, 201)).toThrow();
    expect(() => buildCardCreateDto(cardWithoutId, 200)).toThrow();
    expect(() => buildDeckCreateDto(deckWithoutId, 200)).toThrow();
  });
});
