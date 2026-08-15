import { describe, expect, it } from "vitest";

import { mapCardDocument, parseCardDocument } from "./document";

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
  score: 3,
  numberOfSeen: 4,
};

describe("Card document", () => {
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

  it("maps Card content without StudyProgress fields", () => {
    const card = mapCardDocument("card-a", {
      ...requiredDocument,
      lastSeenAt: 5,
      nextSeeingAt: new Date(6),
      interval: 7,
    });

    expect(card).toEqual({
      id: "card-a",
      frontText: "Front",
      backText: "Back",
      tags: ["science"],
      uniqueKey: "key-card-a",
      deckId: "deck-a",
      uid: "uid-a",
      createdAt: 1,
      updatedAt: 2,
      deletedAt: null,
    });
    expect(card).not.toHaveProperty("score");
    expect(card).not.toHaveProperty("numberOfSeen");
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
});
