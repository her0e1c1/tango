import { describe, expect, it } from "vitest";

import { parseCardCreateDto, parseCardUpdateDto } from "./cardDto";

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

describe("Card raw document contract", () => {
  it("validates create and update writes independently of the Card entity API", () => {
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
