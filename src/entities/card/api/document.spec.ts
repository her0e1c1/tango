import { describe, expect, it } from "vitest";

import { parseCardDocument } from "./document";

const requiredDocument = {
  frontText: "Front",
  backText: "Back",
  tags: ["science"],
  uniqueKey: "key-card-a",
  deckId: "deck-a",
  uid: "uid-a",
  createdAt: 1,
  updatedAt: 2,
  deletedAt: null,
  difficulty: 3,
  numberOfSeen: 4,
};

describe("Card document [CARD-01]", () => {
  it("parses a valid document without adding optional fields", () => {
    expect(parseCardDocument("card-a", requiredDocument)).toEqual(requiredDocument);
  });

  it("preserves optional fields", () => {
    const document = {
      ...requiredDocument,
      id: "legacy-card-a",
      lastSeenAt: 5,
      interval: 6,
      url: "https://example.com/card-a",
      startLine: 7,
      endLine: 8,
    };

    expect(parseCardDocument("card-a", document)).toEqual(document);
  });

  it("normalizes a Firestore Timestamp-like value to a Date", () => {
    const date = new Date(60);
    const nextSeeingAt = { seconds: 0, nanoseconds: 60_000_000, toDate: () => date };

    expect(parseCardDocument("card-a", { ...requiredDocument, nextSeeingAt }).nextSeeingAt).toBe(date);
  });

  it.each([
    ["missing", { ...requiredDocument, frontText: undefined }],
    ["malformed", { ...requiredDocument, tags: [42] }],
  ])("rejects a %s required field", (_case, document) => {
    expect(() => parseCardDocument("card-a", document)).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "card",
        documentId: "card-a",
      })
    );
  });

  it("keeps the collection and document context in parse errors", () => {
    expect(() => parseCardDocument("card-a", { ...requiredDocument, nextSeeingAt: null })).toThrowError(
      'Invalid Firestore card document "card-a": nextSeeingAt'
    );
  });

  it("accepts a legacy score only when difficulty is absent", () => {
    const { difficulty: _difficulty, ...legacyDocument } = requiredDocument;

    expect(parseCardDocument("card-a", { ...legacyDocument, score: -1 })).toEqual({
      ...legacyDocument,
      score: -1,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0, 11])(
    "rejects malformed present difficulty %s without falling back to score",
    (difficulty) => {
      expect(() => parseCardDocument("card-a", { ...requiredDocument, difficulty, score: 0 })).toThrow();
    }
  );

  it("rejects a document that has neither difficulty nor legacy score", () => {
    const { difficulty: _difficulty, ...missingProgress } = requiredDocument;
    expect(() => parseCardDocument("card-a", missingProgress)).toThrow();
  });
});
