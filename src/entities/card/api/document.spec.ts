import { describe, expect, it } from "vitest";

import { readCardDocument } from "./document";

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
  it("maps a valid document without adding optional fields", () => {
    expect(readCardDocument("card-a", requiredDocument)).toEqual({
      card: {
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
      },
      progress: { cardId: "card-a", score: 3, numberOfSeen: 4 },
    });
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

    expect(readCardDocument("card-a", document)).toEqual({
      card: {
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
        url: "https://example.com/card-a",
        startLine: 7,
        endLine: 8,
      },
      progress: { cardId: "card-a", score: 3, numberOfSeen: 4, lastSeenAt: 5, interval: 6 },
    });
  });

  it("normalizes a Firestore Timestamp-like value to a Date", () => {
    const date = new Date(60);
    const nextSeeingAt = { seconds: 0, nanoseconds: 60_000_000, toDate: () => date };

    expect(readCardDocument("card-a", { ...requiredDocument, nextSeeingAt }).progress.nextSeeingAt).toBe(date);
  });

  it("maps Card and StudyProgress independently from one validated document", () => {
    expect(
      readCardDocument("card-a", {
        ...requiredDocument,
        lastSeenAt: 5,
        nextSeeingAt: new Date(6),
        interval: 7,
      })
    ).toEqual({
      card: {
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
      },
      progress: {
        cardId: "card-a",
        score: 3,
        numberOfSeen: 4,
        lastSeenAt: 5,
        nextSeeingAt: new Date(6),
        interval: 7,
      },
    });
  });

  it.each([
    ["missing", { ...requiredDocument, frontText: undefined }],
    ["malformed", { ...requiredDocument, tags: [42] }],
  ])("rejects a %s required field", (_case, document) => {
    expect(() => readCardDocument("card-a", document)).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "card",
        documentId: "card-a",
      })
    );
  });

  it("keeps the collection and document context in parse errors", () => {
    expect(() => readCardDocument("card-a", { ...requiredDocument, nextSeeingAt: null })).toThrowError(
      'Invalid Firestore card document "card-a": nextSeeingAt'
    );
  });
});
