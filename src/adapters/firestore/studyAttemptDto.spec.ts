/** @file Verifies the version 1 StudyAttempt Firestore DTO contract. */

import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { buildStudyAttemptCreateDto, mapStudyAttemptDocument } from "@/adapters/firestore/studyAttemptDto";
import type { StudyAttempt } from "@/domain/studyHistory";

describe("StudyAttempt Firestore DTO", () => {
  const answeredAt = Date.UTC(2026, 7, 9, 3, 4, 5);
  const attempt: StudyAttempt = {
    id: "attempt-1",
    uid: "user-1",
    sessionId: "session-1",
    deckId: "deck-1",
    cardId: "card-1",
    outcome: "mastered",
    answeredAt,
    localDate: "2026-08-09",
    timeZone: "Asia/Tokyo",
    schemaVersion: 1,
  };

  const document = (overrides: Record<string, unknown> = {}) => ({
    uid: attempt.uid,
    sessionId: attempt.sessionId,
    deckId: attempt.deckId,
    cardId: attempt.cardId,
    outcome: attempt.outcome,
    answeredAt: Timestamp.fromMillis(attempt.answeredAt),
    localDate: attempt.localDate,
    timeZone: attempt.timeZone,
    schemaVersion: attempt.schemaVersion,
    ...overrides,
  });

  it("round-trips a valid version 1 attempt without duplicating its document ID", () => {
    const dto = buildStudyAttemptCreateDto(attempt);

    expect(dto).not.toHaveProperty("id");
    expect(dto.answeredAt).toBeInstanceOf(Timestamp);
    expect(dto.answeredAt.toMillis()).toBe(answeredAt);
    expect(mapStudyAttemptDocument(attempt.id, dto)).toEqual(attempt);
  });

  it.each([
    ["id", ""],
    ["uid", ""],
    ["sessionId", ""],
    ["deckId", ""],
    ["cardId", ""],
    ["outcome", "unknown"],
    ["answeredAt", Number.NaN],
    ["answeredAt", Number.MAX_SAFE_INTEGER + 1],
    ["answeredAt", Date.UTC(1999, 11, 31, 23, 59, 59)],
    ["localDate", "2026/08/09"],
    ["localDate", "2026-08-10"],
    ["timeZone", "Not/AZone"],
    ["timeZone", "+01:00"],
    ["schemaVersion", 2],
  ])("rejects an invalid domain %s", (field, value) => {
    expect(() => buildStudyAttemptCreateDto({ ...attempt, [field]: value } as StudyAttempt)).toThrow();
  });

  it("rejects unknown fields when building the exact version 1 payload", () => {
    expect(() =>
      buildStudyAttemptCreateDto({ ...attempt, unexpected: true } as StudyAttempt & { unexpected: boolean })
    ).toThrow();
  });

  it.each([
    ["uid", ""],
    ["sessionId", ""],
    ["deckId", ""],
    ["cardId", ""],
    ["outcome", "unknown"],
    ["answeredAt", answeredAt],
    ["answeredAt", Timestamp.fromMillis(Date.UTC(1999, 11, 31, 23, 59, 59))],
    ["localDate", "2026-02-31"],
    ["localDate", "2026-08-10"],
    ["timeZone", "Not/AZone"],
    ["timeZone", "+01:00"],
    ["schemaVersion", 2],
  ])("rejects an invalid stored %s with document context", (field, value) => {
    expect(() => mapStudyAttemptDocument("attempt-invalid", document({ [field]: value }))).toThrowError(
      expect.objectContaining({
        name: "FirestoreDocumentValidationError",
        collectionName: "studyAttempt",
        documentId: "attempt-invalid",
        message: expect.stringContaining(field),
      })
    );
  });

  it("rejects missing, extra, and invalid document ID fields", () => {
    const { uid: _uid, ...missingUid } = document();

    expect(() => mapStudyAttemptDocument("missing-uid", missingUid)).toThrowError(
      expect.objectContaining({ message: expect.stringContaining("uid") })
    );
    expect(() => mapStudyAttemptDocument("extra-field", document({ unexpected: true }))).toThrowError(
      expect.objectContaining({ message: expect.stringContaining("unexpected") })
    );
    expect(() => mapStudyAttemptDocument("", document())).toThrowError(
      expect.objectContaining({ message: expect.stringContaining("id") })
    );
  });
});
