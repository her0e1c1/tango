import type { Card } from "../model/card";

import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { FirestoreDocumentValidationError } from "@/shared/firestore";
import { createStudyProgressFromCard, mapStudyProgressDocument } from "@/entities/study-progress/@x/card";
import { createCard } from "@/test/factories";
import { buildCardCreateDto, buildCardUpdateDto, mapCardDocument } from "./firestoreDocument";

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
  it("maps only Card fields using the snapshot id", () => {
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
      url: "https://example.com/card",
      startLine: 8,
      endLine: 9,
    });
  });

  it("maps StudyProgress independently from the same document", () => {
    expect(
      mapStudyProgressDocument(
        "snapshot-id",
        cardDocument({ lastSeenAt: 50, nextSeeingAt: Timestamp.fromMillis(60), interval: 7 })
      )
    ).toEqual({
      cardId: "snapshot-id",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 50,
      nextSeeingAt: new Date(60),
      interval: 7,
    });
  });

  it("preserves legacy Date values and omits absent optional fields", () => {
    const nextSeeingAt = new Date(60);
    const mapped = mapStudyProgressDocument("snapshot-id", cardDocument({ nextSeeingAt }));

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
    expect(() => mapCardDocument("missing-card", { uid: "user-2" })).toThrow(FirestoreDocumentValidationError);
  });

  it("builds create and update DTOs from Card-owned fields", () => {
    const card = createCard({
      id: "card-1",
      deckId: "deck-1",
      uid: "user-1",
      tags: ["math"],
      createdAt: 1,
      updatedAt: 2,
      score: 3,
      numberOfSeen: 4,
      nextSeeingAt: new Date(6),
    });

    expect(buildCardCreateDto(card, createStudyProgressFromCard(card), 200)).toEqual(
      expect.objectContaining({ id: "card-1", createdAt: 200, updatedAt: 200, deletedAt: null })
    );
    expect(buildCardUpdateDto(card, 201)).toEqual(
      expect.objectContaining({ deckId: "deck-1", createdAt: 1, updatedAt: 201 })
    );
    expect(buildCardUpdateDto(card, 201)).not.toHaveProperty("id");

    const invalidCard = { ...card, tags: ["math", 42] } as unknown as Card;
    expect(() => buildCardCreateDto(invalidCard, createStudyProgressFromCard(invalidCard), 200)).toThrow();
  });
});
