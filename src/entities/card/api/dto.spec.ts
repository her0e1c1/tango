import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { convertCardDtoToCard, parseCardCreateDto, parseCardUpdateDto } from "./dto";

const cardDto = (overrides: Record<string, unknown> = {}) => ({
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

describe("Card DTO", () => {
  it("converts Firestore timestamps and optional fields using the snapshot id", () => {
    expect(
      convertCardDtoToCard(
        "snapshot-id",
        cardDto({
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
    const mapped = convertCardDtoToCard("snapshot-id", cardDto({ nextSeeingAt }));

    expect(mapped.nextSeeingAt).toEqual(nextSeeingAt);
    expect(mapped).not.toHaveProperty("lastSeenAt");
    expect(mapped).not.toHaveProperty("interval");
    expect(mapped).not.toHaveProperty("url");
    expect(mapped).not.toHaveProperty("startLine");
    expect(mapped).not.toHaveProperty("endLine");
  });

  it("reports invalid documents through the Firestore validation boundary", () => {
    expect(() => convertCardDtoToCard("invalid-card", cardDto({ nextSeeingAt: null }))).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "card",
        documentId: "invalid-card",
        message: expect.stringContaining("nextSeeingAt"),
      })
    );
    expect(() => convertCardDtoToCard("missing-card", { uid: "user-2" })).toThrowError(
      expect.objectContaining({ name: "FirestoreDocumentValidationError" })
    );
  });

  it("validates create and update writes through the raw document contract", () => {
    expect(parseCardCreateDto("new-card", { ...cardDto(), id: "new-card", ignored: true })).toEqual({
      ...cardDto(),
      id: "new-card",
    });
    expect(parseCardUpdateDto("existing-card", { score: 5, updatedAt: 30, ignored: true })).toEqual({
      score: 5,
      updatedAt: 30,
    });
    expect(() => parseCardCreateDto("new-card", cardDto())).toThrowError(
      expect.objectContaining({ name: "FirestoreDocumentValidationError" })
    );
    expect(() => parseCardUpdateDto("existing-card", { score: "invalid", updatedAt: 30 })).toThrowError(
      expect.objectContaining({ name: "FirestoreDocumentValidationError" })
    );
  });
});
