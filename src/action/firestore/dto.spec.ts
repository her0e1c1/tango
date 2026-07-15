import { describe, expect, it } from "vitest";

import { buildCardCreateDto, buildCardUpdateDto, buildDeckCreateDto, buildDeckUpdateDto } from "@/action/firestore/dto";
import { createCard, createDeck } from "@/test/factories";

describe("Firestore DTO builders", () => {
  const deck = {
    ...createDeck({
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
    }),
    currentIndex: 1,
    cardOrderIds: ["card-1"],
    showBackText: true,
    autoPlay: true,
    lastSwipe: "cardSwipeRight",
  } satisfies Deck & Record<"currentIndex" | "cardOrderIds" | "showBackText" | "autoPlay" | "lastSwipe", unknown>;

  const card = {
    ...createCard({
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
    }),
    currentIndex: 1,
    cardOrderIds: ["card-1"],
  } satisfies Card & Record<"currentIndex" | "cardOrderIds", unknown>;

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
});
