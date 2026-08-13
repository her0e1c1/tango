import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { mapCardDocument } from "./firestoreDocument";

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

describe("Card Firestore document", () => {
  it("maps Firestore timestamps and optional fields using the snapshot id", () => {
    expect(
      mapCardDocument(
        "snapshot-id",
        cardDocument({
          lastSeenAt: 50,
          nextSeeingAt: Timestamp.fromMillis(60),
          interval: 7,
          url: "https://example.com/card",
          startLine: 8,
          endLine: 9,
        })
      )
    ).toEqual({
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

  it("preserves legacy Date values and omits absent optional fields", () => {
    const nextSeeingAt = new Date(60);
    const mapped = mapCardDocument("snapshot-id", cardDocument({ nextSeeingAt }));

    expect(mapped.nextSeeingAt).toEqual(nextSeeingAt);
    expect(mapped).not.toHaveProperty("lastSeenAt");
    expect(mapped).not.toHaveProperty("interval");
    expect(mapped).not.toHaveProperty("url");
    expect(mapped).not.toHaveProperty("startLine");
    expect(mapped).not.toHaveProperty("endLine");
  });

  it("reports invalid documents through the Firestore validation boundary", () => {
    expect(() => mapCardDocument("invalid-card", cardDocument({ nextSeeingAt: null }))).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "card",
        documentId: "invalid-card",
        message: expect.stringContaining("nextSeeingAt"),
      })
    );
    expect(() => mapCardDocument("missing-card", { uid: "user-2" })).toThrowError(
      expect.objectContaining({ name: "FirestoreDocumentValidationError" })
    );
  });
});
