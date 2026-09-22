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
  fsrs: null,
  deletedAt: null,
};

describe("Card document [CARD-VIEW-01 STUDY-SESSION-01]", () => {
  it("parses a valid document without adding optional fields", () => {
    expect(parseCardDocument("card-a", requiredDocument)).toEqual(requiredDocument);
  });

  it("preserves optional fields", () => {
    const document = {
      ...requiredDocument,
      id: "legacy-card-a",
      url: "https://example.com/card-a",
      startLine: 7,
      endLine: 8,
    };

    expect(parseCardDocument("card-a", document)).toEqual(document);
  });

  it.each([
    ["missing", { ...requiredDocument, frontText: undefined }],
    ["malformed", { ...requiredDocument, tags: [42] }],
    ["missing FSRS", { ...requiredDocument, fsrs: undefined }],
    ["invalid FSRS", { ...requiredDocument, fsrs: {} }],
  ])("rejects a %s required field", (_case, document) => {
    expect(() => parseCardDocument("card-a", document)).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "card",
        documentId: "card-a",
      })
    );
  });
});
