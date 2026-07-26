/** @file Verifies malformed Firestore data is rejected before entering application state. */

import { describe, expect, it } from "vitest";

import {
  buildDeckFilterUpdateDto,
  FirestoreDocumentValidationError,
  mapCardDocument,
  mapDeckDocument,
} from "@/adapters/firestore/dto";
import { createCard, createDeck } from "@/test/factories";

const deckDocument = () => {
  const deck = createDeck();
  return { ...deck, id: deck.id };
};

const cardDocument = () => {
  const card = createCard();
  return { ...card, id: card.id };
};

describe("Firestore DTO runtime validation", () => {
  it("identifies an invalid Deck and its document ID", () => {
    const invalid = { ...deckDocument(), selectedTags: "not-an-array" };

    try {
      mapDeckDocument("broken-deck", invalid);
      throw new Error("Expected mapDeckDocument to reject malformed data");
    } catch (error) {
      expect(error).toBeInstanceOf(FirestoreDocumentValidationError);
      expect(error).toMatchObject({
        name: "FirestoreDocumentValidationError",
        collection: "deck",
        documentId: "broken-deck",
      });
    }
  });

  it("rejects invalid Card counters instead of accepting a cast", () => {
    const invalid = { ...cardDocument(), numberOfSeen: -1 };

    expect(() => mapCardDocument("broken-card", invalid)).toThrow(FirestoreDocumentValidationError);
    expect(() => mapCardDocument("broken-card", invalid)).toThrow("numberOfSeen");
  });

  it("rejects invalid Timestamp-like values", () => {
    const invalid = {
      ...cardDocument(),
      nextSeeingAt: { toDate: () => new Date(Number.NaN) },
    };

    expect(() => mapCardDocument("broken-card", invalid)).toThrow("nextSeeingAt");
  });

  it("builds a narrow Deck filter update DTO", () => {
    expect(
      buildDeckFilterUpdateDto(
        { selectedTags: ["math"], tagAndFilter: true, scoreMin: -2, scoreMax: 4 },
        100
      )
    ).toEqual({
      selectedTags: ["math"],
      tagAndFilter: true,
      scoreMin: -2,
      scoreMax: 4,
      updatedAt: 100,
    });
  });
});
